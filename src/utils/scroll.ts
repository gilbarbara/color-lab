export function scrollToSelector(id: string | undefined) {
  if (id) {
    const element = document.getElementById(id);

    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
