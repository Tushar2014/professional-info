// The configured `base` (import.meta.env.BASE_URL) is '/professional-info'
// because trailingSlash is 'never'. Every internal link on the site must be
// prefixed with it for the build served from https://tushar2014.github.io.
export const siteRoot = import.meta.env.BASE_URL

/** Prefix an absolute route (e.g. '/blog') with the deployment base. */
export const page = (path: string) => `${siteRoot}${path}`