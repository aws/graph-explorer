import groupBy from "lodash/groupBy";
import type { AdvancedListItemType } from "../../components/AdvancedList";

export type AdvancedListOptions<TDatum extends object> = {
  getGroupLabel?(datum: TDatum): string;
  disableGroupSorting?: boolean;
  getItem(datum: TDatum): AdvancedListItemType<TDatum>;
  disableItemSorting?: boolean;
};

const sortFn = <TDatum extends object>(
  a: AdvancedListItemType<TDatum>,
  b: AdvancedListItemType<TDatum>
) => {
  let testProps = a.title;
  let nextTestProps = b.title;
  if (typeof a.title !== "string") {
    testProps = (a.title as any).toString();
  }
  if (typeof b.title !== "string") {
    nextTestProps = (b.title as any).toString();
  }
  return testProps.localeCompare(nextTestProps);
};

const toAdvancedList = <TDatum extends object>(
  data: TDatum[],
  options: AdvancedListOptions<TDatum>
): AdvancedListItemType<TDatum>[] => {
  const {
    getGroupLabel,
    getItem,
    disableGroupSorting,
    disableItemSorting,
  } = options;

  if (getGroupLabel) {
    let groups = Object.entries(groupBy(data, getGroupLabel));
    if (!disableGroupSorting) {
      groups = groups.sort(([a], [b]) => a.localeCompare(b));
    }

    return groups.map(([group, items]) => {
      let lisItems = items.map(getItem);
      try {
        if (!disableItemSorting) {
          lisItems = lisItems.sort(sortFn);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error(e);
        }
      }
      return {
        group,
        id: group,
        title: group,
        items: lisItems,
      };
    });
  }

  const lisItems = data.map(getItem);
  if (!disableItemSorting) {
    return lisItems.sort(sortFn);
  }

  return lisItems;
};

export default toAdvancedList;
