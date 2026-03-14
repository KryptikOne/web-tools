"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import styles from "./HttpStatusCodes.module.scss";

interface StatusCode {
  code: number;
  name: string;
  description: string;
  example: string;
}

interface StatusCategory {
  name: string;
  range: string;
  colorClass: string;
  codes: StatusCode[];
}

const STATUS_DATA: StatusCategory[] = [
  {
    name: "1xx Informational",
    range: "100-103",
    colorClass: "info",
    codes: [
      { code: 100, name: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", example: "Client sends Expect: 100-continue header; server responds with 100 before the client sends the body." },
      { code: 101, name: "Switching Protocols", description: "The server is switching protocols as requested by the client via the Upgrade header.", example: "Upgrading from HTTP/1.1 to WebSocket using the Upgrade: websocket header." },
      { code: 102, name: "Processing", description: "The server has received and is processing the request, but no response is available yet (WebDAV).", example: "A long-running WebDAV request where the server signals it is still working on the request." },
      { code: 103, name: "Early Hints", description: "Used to return some response headers before the final HTTP message, allowing the client to preload resources.", example: "Server sends Link headers for CSS/JS files so the browser can start loading them before the full response." },
    ],
  },
  {
    name: "2xx Success",
    range: "200-226",
    colorClass: "success",
    codes: [
      { code: 200, name: "OK", description: "The request has succeeded. The meaning depends on the HTTP method used.", example: "GET /api/users returns a list of users with a 200 status." },
      { code: 201, name: "Created", description: "The request has been fulfilled and a new resource has been created.", example: "POST /api/users with user data creates a new user and returns 201 with the created resource." },
      { code: 202, name: "Accepted", description: "The request has been accepted for processing, but the processing has not been completed.", example: "POST /api/reports/generate queues a report for background generation." },
      { code: 203, name: "Non-Authoritative Information", description: "The returned metadata is not exactly the same as available from the origin server.", example: "A proxy returns cached or transformed content that differs slightly from the origin." },
      { code: 204, name: "No Content", description: "The server successfully processed the request but is not returning any content.", example: "DELETE /api/users/123 successfully deletes the user but returns no body." },
      { code: 205, name: "Reset Content", description: "The server successfully processed the request and asks the client to reset the document view.", example: "After submitting a form, the server responds with 205 telling the browser to clear the form." },
      { code: 206, name: "Partial Content", description: "The server is delivering only part of the resource due to a Range header sent by the client.", example: "A video player requests bytes 1000-2000 of a video file for streaming." },
      { code: 207, name: "Multi-Status", description: "Conveys information about multiple resources where multiple status codes might be appropriate (WebDAV).", example: "A WebDAV PROPFIND request returns status for multiple files in a single response." },
      { code: 208, name: "Already Reported", description: "The members of a DAV binding have already been enumerated and are not being included again (WebDAV).", example: "Used inside a DAV: propstat response to avoid enumerating internal members of multiple bindings." },
      { code: 226, name: "IM Used", description: "The server has fulfilled a GET request and the response is a representation of the result of instance-manipulations applied to the current instance.", example: "Server applies delta encoding to a resource and responds with the manipulated instance." },
    ],
  },
  {
    name: "3xx Redirection",
    range: "300-308",
    colorClass: "warning",
    codes: [
      { code: 300, name: "Multiple Choices", description: "The request has more than one possible response. The user or user agent should choose one.", example: "A resource available in multiple formats (HTML, JSON, XML) where the client must specify." },
      { code: 301, name: "Moved Permanently", description: "The URL of the requested resource has been changed permanently. The new URL is given in the response.", example: "Redirecting http://example.com to https://example.com permanently." },
      { code: 302, name: "Found", description: "The URI of requested resource has been changed temporarily. The client should use the same method for future requests.", example: "Redirecting to a login page when a session expires, with the original URL preserved." },
      { code: 303, name: "See Other", description: "The server sent this response to direct the client to get the requested resource at another URI with a GET request.", example: "After a POST form submission, redirect the user to a confirmation page via GET." },
      { code: 304, name: "Not Modified", description: "The resource has not been modified since the version specified by the request headers (If-Modified-Since or If-None-Match).", example: "Browser sends If-None-Match with an ETag; server confirms the cached version is still valid." },
      { code: 305, name: "Use Proxy", description: "The requested resource must be accessed through the proxy given by the Location header. Deprecated for security reasons.", example: "Server instructs the client to re-request the resource through a specified proxy (rarely used)." },
      { code: 307, name: "Temporary Redirect", description: "The server sends this response to direct the client to get the requested resource at another URI with the same method.", example: "Temporarily redirecting API traffic to a different server during maintenance, preserving the HTTP method." },
      { code: 308, name: "Permanent Redirect", description: "The resource is now permanently located at another URI, specified by the Location header. The method and body must not change.", example: "Permanently moving an API endpoint from /v1/users to /v2/users while preserving POST method." },
    ],
  },
  {
    name: "4xx Client Error",
    range: "400-451",
    colorClass: "error",
    codes: [
      { code: 400, name: "Bad Request", description: "The server cannot process the request due to something perceived to be a client error (malformed syntax, invalid framing, etc.).", example: "Sending invalid JSON in a POST body: { name: } missing the value." },
      { code: 401, name: "Unauthorized", description: "The client must authenticate itself to get the requested response. Semantically means 'unauthenticated'.", example: "Calling GET /api/profile without an Authorization header or with an expired token." },
      { code: 402, name: "Payment Required", description: "Reserved for future use. Originally created for digital payment systems.", example: "An API that requires a paid subscription returns 402 when the free tier limit is exceeded." },
      { code: 403, name: "Forbidden", description: "The client does not have access rights to the content. Unlike 401, the server knows the client's identity.", example: "A regular user tries to access DELETE /api/admin/users, which requires admin privileges." },
      { code: 404, name: "Not Found", description: "The server cannot find the requested resource. The URL is not recognized or the endpoint is valid but the resource does not exist.", example: "GET /api/users/99999 where user ID 99999 does not exist in the database." },
      { code: 405, name: "Method Not Allowed", description: "The request method is known by the server but is not supported by the target resource.", example: "Sending a DELETE request to an endpoint that only accepts GET and POST." },
      { code: 406, name: "Not Acceptable", description: "The server cannot produce a response matching the list of acceptable values defined in the request's proactive content negotiation headers.", example: "Client sends Accept: application/xml but the server can only produce JSON." },
      { code: 407, name: "Proxy Authentication Required", description: "Similar to 401, but authentication needs to be done by a proxy.", example: "A corporate proxy requires authentication before forwarding the request to the internet." },
      { code: 408, name: "Request Timeout", description: "The server timed out waiting for the request. The client did not produce a request within the time the server was prepared to wait.", example: "Client opens a connection but takes too long to send the complete request headers or body." },
      { code: 409, name: "Conflict", description: "The request conflicts with the current state of the server.", example: "PUT /api/users/123 with an outdated version number when another update has already been applied." },
      { code: 410, name: "Gone", description: "The content has been permanently deleted from the server, with no forwarding address.", example: "An API version that has been sunset: GET /api/v1/users returns 410 since v1 was removed." },
      { code: 411, name: "Length Required", description: "The server rejects the request because the Content-Length header field is not defined and the server requires it.", example: "Sending a POST request without a Content-Length header to a server that requires it." },
      { code: 412, name: "Precondition Failed", description: "The client has indicated preconditions in its headers which the server does not meet.", example: "Using If-Unmodified-Since with a date older than the resource's last modification." },
      { code: 413, name: "Payload Too Large", description: "The request entity is larger than limits defined by the server.", example: "Uploading a 500MB file to a server with a 100MB upload limit." },
      { code: 414, name: "URI Too Long", description: "The URI requested by the client is longer than the server is willing to interpret.", example: "A GET request with thousands of query parameters creating a URL over 8,000 characters." },
      { code: 415, name: "Unsupported Media Type", description: "The media format of the requested data is not supported by the server.", example: "Sending Content-Type: text/plain to an endpoint that only accepts application/json." },
      { code: 416, name: "Range Not Satisfiable", description: "The range specified by the Range header field in the request cannot be fulfilled.", example: "Requesting bytes 1000-2000 of a file that is only 500 bytes long." },
      { code: 417, name: "Expectation Failed", description: "The expectation given in the Expect request header could not be met by the server.", example: "Client sends Expect: 100-continue but the server cannot honor that expectation." },
      { code: 418, name: "I'm a Teapot", description: "The server refuses to brew coffee because it is, permanently, a teapot. Defined by the Hyper Text Coffee Pot Control Protocol (RFC 2324).", example: "An Easter egg endpoint that returns 418 with a teapot ASCII art response body." },
      { code: 421, name: "Misdirected Request", description: "The request was directed at a server that is not able to produce a response.", example: "A TLS connection to server A receives a request intended for server B's hostname." },
      { code: 422, name: "Unprocessable Entity", description: "The request was well-formed but was unable to be followed due to semantic errors.", example: "POST /api/users with { email: 'not-an-email', age: -5 } fails validation." },
      { code: 423, name: "Locked", description: "The resource that is being accessed is locked (WebDAV).", example: "Attempting to edit a WebDAV file that another user has locked for exclusive editing." },
      { code: 424, name: "Failed Dependency", description: "The request failed due to failure of a previous request (WebDAV).", example: "A batch WebDAV operation where a COPY fails because a dependent MOVE failed first." },
      { code: 425, name: "Too Early", description: "The server is unwilling to risk processing a request that might be replayed.", example: "Server rejects a request sent in TLS early data (0-RTT) to prevent replay attacks." },
      { code: 426, name: "Upgrade Required", description: "The server refuses to perform the request using the current protocol but might do so after the client upgrades to a different protocol.", example: "Server requires the client to upgrade from HTTP/1.1 to HTTP/2 or TLS." },
      { code: 428, name: "Precondition Required", description: "The origin server requires the request to be conditional to prevent the 'lost update' problem.", example: "Server requires If-Match header with an ETag for PUT requests to prevent concurrent overwrites." },
      { code: 429, name: "Too Many Requests", description: "The user has sent too many requests in a given amount of time (rate limiting).", example: "API rate limit of 100 requests/minute exceeded; response includes Retry-After: 30 header." },
      { code: 431, name: "Request Header Fields Too Large", description: "The server is unwilling to process the request because its header fields are too large.", example: "A request with extremely large cookies that exceed the server's header size limit." },
      { code: 451, name: "Unavailable For Legal Reasons", description: "The user requests a resource that is not available due to legal reasons, such as censorship or government-mandated blocks.", example: "A website blocked in a specific country due to local regulations returns 451 with a legal explanation." },
    ],
  },
  {
    name: "5xx Server Error",
    range: "500-511",
    colorClass: "error",
    codes: [
      { code: 500, name: "Internal Server Error", description: "The server has encountered a situation it does not know how to handle.", example: "An unhandled exception in server-side code causes a generic 500 response." },
      { code: 501, name: "Not Implemented", description: "The request method is not supported by the server and cannot be handled.", example: "Server receives a PATCH request but the application does not implement PATCH handling." },
      { code: 502, name: "Bad Gateway", description: "The server, while acting as a gateway or proxy, received an invalid response from the upstream server.", example: "Nginx receives a malformed response from a backend Node.js application that crashed." },
      { code: 503, name: "Service Unavailable", description: "The server is not ready to handle the request. Common causes include maintenance or overloading.", example: "Server is undergoing scheduled maintenance and responds with Retry-After: 3600 header." },
      { code: 504, name: "Gateway Timeout", description: "The server, acting as a gateway, did not get a response in time from the upstream server.", example: "A reverse proxy times out waiting for a slow database query on the backend server." },
      { code: 505, name: "HTTP Version Not Supported", description: "The HTTP version used in the request is not supported by the server.", example: "Client sends a request using HTTP/3 to a server that only supports HTTP/1.1 and HTTP/2." },
      { code: 506, name: "Variant Also Negotiates", description: "The server has an internal configuration error: transparent content negotiation results in a circular reference.", example: "A misconfigured server where the chosen variant resource is itself configured to negotiate." },
      { code: 507, name: "Insufficient Storage", description: "The server is unable to store the representation needed to complete the request (WebDAV).", example: "A WebDAV server runs out of disk space while trying to store an uploaded file." },
      { code: 508, name: "Loop Detected", description: "The server detected an infinite loop while processing the request (WebDAV).", example: "A WebDAV PROPFIND with Depth: infinity encounters a circular symbolic link." },
      { code: 510, name: "Not Extended", description: "Further extensions to the request are required for the server to fulfill it.", example: "The server requires a specific HTTP extension that the client did not include in the request." },
      { code: 511, name: "Network Authentication Required", description: "The client needs to authenticate to gain network access, typically used by captive portals.", example: "Connecting to airport Wi-Fi; a captive portal returns 511 until the user accepts terms or logs in." },
    ],
  },
];

export default function HttpStatusCodes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const toggleCategory = useCallback((categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }, []);

  const toggleCode = useCallback((code: number) => {
    setExpandedCode((prev) => (prev === code ? null : code));
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return STATUS_DATA;

    return STATUS_DATA.map((category) => ({
      ...category,
      codes: category.codes.filter((sc) => {
        return (
          sc.code.toString().includes(query) ||
          sc.name.toLowerCase().includes(query) ||
          sc.description.toLowerCase().includes(query)
        );
      }),
    })).filter((category) => category.codes.length > 0);
  }, [searchQuery]);

  const totalCodes = useMemo(() => {
    return STATUS_DATA.reduce((sum, cat) => sum + cat.codes.length, 0);
  }, []);

  const filteredCount = useMemo(() => {
    return filteredData.reduce((sum, cat) => sum + cat.codes.length, 0);
  }, [filteredData]);

  const formatCopyText = (sc: StatusCode): string => {
    return `${sc.code} ${sc.name}\n${sc.description}\nExample: ${sc.example}`;
  };

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={`flex flex-wrap items-center gap-4 mb-6 ${styles.controlsBar}`}>
        <div className={`flex-1 ${styles.searchWrapper}`}>
          <MagnifyingGlassIcon className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by status code, name, or description..."
            className={styles.searchInput}
          />
        </div>
        <span className={styles.resultCount}>
          {searchQuery ? `${filteredCount} of ${totalCodes}` : `${totalCodes} status codes`}
        </span>
      </div>

      {/* Category Sections */}
      {filteredData.map((category) => {
        const isCollapsed = collapsedCategories.has(category.name);

        return (
          <div
            key={category.name}
            className={`mb-6 ${styles.categorySection} ${styles[category.colorClass]}`}
          >
            <button
              onClick={() => toggleCategory(category.name)}
              className={`flex items-center gap-3 w-full text-left mb-0 ${styles.categoryHeader}`}
            >
              {isCollapsed ? (
                <ChevronRightIcon className={styles.chevronIcon} />
              ) : (
                <ChevronDownIcon className={styles.chevronIcon} />
              )}
              <h2 className={styles.categoryTitle}>{category.name}</h2>
              <span className={styles.categoryBadge}>{category.codes.length}</span>
            </button>

            {!isCollapsed && (
              <div className={`flex flex-col gap-2 mt-4 ${styles.codesList}`}>
                {category.codes.map((sc) => {
                  const isExpanded = expandedCode === sc.code;
                  const copyId = `status-${sc.code}`;
                  const isCopied = copiedId === copyId;

                  return (
                    <div
                      key={sc.code}
                      className={`${styles.statusCard} ${isExpanded ? styles.expanded : ""}`}
                    >
                      <div
                        className={`flex items-center gap-4 cursor-pointer ${styles.statusHeader}`}
                        onClick={() => toggleCode(sc.code)}
                      >
                        <span className={`${styles.statusCode} ${styles[category.colorClass]}`}>
                          {sc.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={styles.statusName}>{sc.name}</span>
                          {!isExpanded && (
                            <p className={`mt-0.5 ${styles.statusPreview}`}>{sc.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(formatCopyText(sc), copyId);
                          }}
                          className={`${styles.copyBtn} ${isCopied ? styles.copied : ""}`}
                          title="Copy status code info"
                        >
                          {isCopied ? (
                            <CheckIcon className={styles.copyIcon} />
                          ) : (
                            <ClipboardDocumentIcon className={styles.copyIcon} />
                          )}
                        </button>
                        {isExpanded ? (
                          <ChevronDownIcon className={styles.expandIcon} />
                        ) : (
                          <ChevronRightIcon className={styles.expandIcon} />
                        )}
                      </div>

                      {isExpanded && (
                        <div className={`mt-4 pt-4 ${styles.statusDetails}`}>
                          <div className="mb-3">
                            <h4 className={styles.detailLabel}>Description</h4>
                            <p className={styles.detailText}>{sc.description}</p>
                          </div>
                          <div>
                            <h4 className={styles.detailLabel}>Usage Example</h4>
                            <p className={styles.detailExample}>{sc.example}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {filteredData.length === 0 && (
        <div className={`text-center p-12 ${styles.noResults}`}>
          <p>No status codes found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
