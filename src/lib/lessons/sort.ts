type SortableLesson = {
  title?: string | null;
  order?: number | null;
  createdAt?: string | Date | null;
};

const numberFormatter = new Intl.Collator("vi", {
  numeric: true,
  sensitivity: "base",
});

function getLessonSortNumber(title?: string | null) {
  if (!title) return Number.POSITIVE_INFINITY;

  const match = title.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

export function sortLessonsNatural<T extends SortableLesson>(lessons: T[]) {
  return [...lessons].sort((left, right) => {
    const leftNumber = getLessonSortNumber(left.title);
    const rightNumber = getLessonSortNumber(right.title);

    if (leftNumber !== rightNumber) return leftNumber - rightNumber;

    const titleCompare = numberFormatter.compare(left.title || "", right.title || "");
    if (titleCompare !== 0) return titleCompare;

    const leftOrder = left.order ?? Number.POSITIVE_INFINITY;
    const rightOrder = right.order ?? Number.POSITIVE_INFINITY;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftCreatedAt = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightCreatedAt = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return leftCreatedAt - rightCreatedAt;
  });
}
