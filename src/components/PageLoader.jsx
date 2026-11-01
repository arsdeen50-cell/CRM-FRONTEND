// Shown for a moment while a page's code downloads the first time it's opened
const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
  </div>
);

export default PageLoader;
