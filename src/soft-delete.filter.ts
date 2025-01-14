import { Filter } from "@mikro-orm/core";

interface FilterArguments {
  getAll?: boolean;
  getOnlyDeleted?: boolean;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const WithSoftDeleteFilter = (): ClassDecorator => {
  return Filter({
    name: "soft-delete",
    cond: ({ getAll, getOnlyDeleted }: FilterArguments = {}) => {
      if (getAll) {
        return {};
      }
      if (getOnlyDeleted) {
        return {
          deletedAt: {
            $ne: null,
          },
        };
      }
      return {
        deletedAt: null,
      };
    },
    default: true,
  });
};

export default WithSoftDeleteFilter;
