import { Filter } from "@mikro-orm/core";

interface FilterArguments {
  getAll?: boolean;
  getOnlyDeleted?: boolean;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const WithSoftDeleteFilter = (): ClassDecorator => {
  return Filter({
    name: "softDelete",
    cond: ({ getAll, getOnlyDeleted }: FilterArguments = {}) => {
      console.log(getAll, getOnlyDeleted);
      if (getAll) {
        console.log("getAll");
        return {};
      }
      if (getOnlyDeleted) {
        console.log("getONlyDeleted");
        return {
          deletedAt: {
            $ne: null,
          },
        };
      }
      console.log("default");
      return {
        deletedAt: null,
      };
    },
    default: true,
  });
};

export default WithSoftDeleteFilter;
