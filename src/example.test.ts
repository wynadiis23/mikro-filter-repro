import {
  BaseEntity,
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from "@mikro-orm/sqlite";
import WithSoftDeleteFilter from "./soft-delete.filter";

@Entity()
@WithSoftDeleteFilter()
class SharedEntity extends BaseEntity {
  [OptionalProps]?: "createdAt" | "updatedAt";

  @PrimaryKey({
    autoincrement: true,
  })
  id: number | undefined;

  @Property({
    name: "created_at",
    type: "timestamp with time zone",
    onCreate: () => new Date(),
    default: "NOW()",
  })
  createdAt = new Date();

  @Property({ name: "created_by", length: 128, default: "SYSTEM" })
  createdBy: string | undefined;

  @Property({
    name: "updated_at",
    type: "timestamp with time zone",
    onUpdate: () => new Date(),
    default: "NOW()",
  })
  updatedAt = new Date();

  @Property({ name: "updated_by", length: 128, default: "SYSTEM" })
  updatedBy: string | undefined;

  @Property({
    name: "deleted_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  deletedAt: Date | null = null;
}

@Entity()
class Document extends SharedEntity {
  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany(() => StatusHistories, (dsh) => dsh.document)
  statusHistories = new Collection<StatusHistories>(this);

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }
}

@Entity()
class StatusHistories extends SharedEntity {
  constructor(imageUrl: string, remark: string, document: Document) {
    super();

    this.imageUrl = imageUrl;
    this.remark = remark;
    this.document = document;
  }

  @Property({
    name: "image_url",
    length: 255,
    nullable: true,
  })
  imageUrl: string | null = null;

  @Property({
    name: "remark",
    length: 255,
    nullable: true,
  })
  remark: string | null = null;

  @ManyToOne(() => Document)
  document: Document;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [Document, StatusHistories],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("fetch document and status", async () => {
  const document = new Document("John Doe", "email@mail.com");
  const status = new StatusHistories("image_url", "remark", document);
  const status2 = new StatusHistories("image_url2", "remark2", document);
  status2.deletedAt = new Date();

  document.statusHistories.add(status);
  document.statusHistories.add(status2);

  await orm.em.persistAndFlush(document);

  const document2 = new Document("Jane Doe", "email2@mail.com");
  document2.deletedAt = new Date();

  await orm.em.persistAndFlush(document2);

  orm.em.clear();

  const query = orm.em.createQueryBuilder(Document);

  // filter condition on query builder is on join condition
  // workaround for now
  query.leftJoinAndSelect("statusHistories", "sh", { deletedAt: null }, [
    "id",
    "deletedAt",
    "imageUrl",
    "remark",
  ]);

  await query.applyFilters({
    softDelete: {},
  });

  const [result, count] = await query.getResultAndCount();

  console.log("result length", result.length);
  console.log(result[0].statusHistories.getItems());

  const resultLength = result.length;
  expect(resultLength).toBe(1);

  const statusHistories = result[0].statusHistories.getItems();
  expect(statusHistories.length).toBe(1);

  // const repo = orm.em.getRepository(Document);
  // const document3 = await repo.find(
  //   {},
  //   {
  //     populate: ["statusHistories"],
  //   }
  // );

  // console.log(document3);
});
