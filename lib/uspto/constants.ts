/** Default ODP host; override with USPTO_API_BASE_URL. */
export const USPTO_DEFAULT_BASE_URL = "https://api.uspto.gov";

/** Patent File Wrapper search (POST JSON body, not GET query string). */
export const USPTO_PATENT_SEARCH_PATH = "/api/v1/patent/applications/search";

export const USPTO_SEARCH_RESULT_LIMIT = 5;

export const USPTO_SEARCH_OFFSET = 0;

/** Max keyword length sent to USPTO query field. */
export const USPTO_QUERY_MAX_CHARS = 500;
