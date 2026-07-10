/* Body scroll lock that compensates for the scrollbar so the page never
   shifts when a dialog opens. Returns the unlock function. */
export function lockBodyScroll(): () => void {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const previousOverflow = document.body.style.overflow;
  const previousPadding = document.body.style.paddingInlineEnd;
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingInlineEnd = `${scrollbarWidth}px`;
  }
  return () => {
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingInlineEnd = previousPadding;
  };
}
