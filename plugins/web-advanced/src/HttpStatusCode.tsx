import React, { useEffect } from 'react';
import { Search } from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'http-status-codes';

const CODES = [
    { code: 100, title: "Continue", desc: "The server has received the request headers and the client should proceed to send the request body." },
    { code: 101, title: "Switching Protocols", desc: "The requester has asked the server to switch protocols." },
    { code: 102, title: "Processing", desc: "Processing (WebDAV)." },
    { code: 200, title: "OK", desc: "The request is standard response for successful HTTP requests." },
    { code: 201, title: "Created", desc: "The request has been fulfilled, resulting in the creation of a new resource." },
    { code: 202, title: "Accepted", desc: "The request has been accepted for processing, but the processing has not been completed." },
    { code: 204, title: "No Content", desc: "The server successfully processed the request and is not returning any content." },
    { code: 301, title: "Moved Permanently", desc: "This and all future requests should be directed to the given URI." },
    { code: 302, title: "Found", desc: "Simple redirection." },
    { code: 304, title: "Not Modified", desc: "Indicates that the resource has not been modified since the version specified by the request headers." },
    { code: 307, title: "Temporary Redirect", desc: "Temporary redirection." },
    { code: 400, title: "Bad Request", desc: "The server cannot or will not process the request due to an apparent client error." },
    { code: 401, title: "Unauthorized", desc: "Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided." },
    { code: 403, title: "Forbidden", desc: "The request was valid, but the server is refusing action." },
    { code: 404, title: "Not Found", desc: "The requested resource could not be found but may be available in the future." },
    { code: 405, title: "Method Not Allowed", desc: "A request method is not supported for the requested resource." },
    { code: 408, title: "Request Timeout", desc: "The server timed out waiting for the request." },
    { code: 418, title: "I'm a teapot", desc: "Hyper Text Coffee Pot Control Protocol (HTCPCP/1.0)." },
    { code: 429, title: "Too Many Requests", desc: "The user has sent too many requests in a given amount of time." },
    { code: 500, title: "Internal Server Error", desc: "A generic error message, given when an unexpected condition was encountered and no more specific message is suitable." },
    { code: 501, title: "Not Implemented", desc: "The server either does not recognize the request method, or it lacks the ability to fulfill the request." },
    { code: 502, title: "Bad Gateway", desc: "The server was acting as a gateway or proxy and received an invalid response from the upstream server." },
    { code: 503, title: "Service Unavailable", desc: "The server is currently unavailable (because it is overloaded or down for maintenance)." },
    { code: 504, title: "Gateway Timeout", desc: "The server was acting as a gateway or proxy and did not receive a timely response from the upstream server." },
];

interface HttpStatusCodeProps {
    tabId?: string;
}

export const HttpStatusCode: React.FC<HttpStatusCodeProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '' }; // We'll use 'input' for search
    const search = data.input;

    const setSearch = (val: string) => {
        setToolData(effectiveId, { input: val });
    }

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const filtered = CODES.filter(c =>
        c.code.toString().includes(search) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <ToolPane
            toolId={effectiveId}
            title="HTTP Status Codes"
            description="Browser-friendly list of HTTP status codes"
            onClear={() => setSearch('')}
        >
            <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
                <Input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search codes..."
                    icon={Search}
                    autoFocus
                    fullWidth
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(code => (
                        <div
                            key={code.code}
                            className={`p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors ${code.code >= 500 ? 'border-red-500/20' :
                                code.code >= 400 ? 'border-orange-500/20' :
                                    code.code >= 300 ? 'border-blue-500/20' :
                                        code.code >= 200 ? 'border-emerald-500/20' : 'border-gray-500/20'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-2xl font-black ${code.code >= 500 ? 'text-red-400' :
                                    code.code >= 400 ? 'text-orange-400' :
                                        code.code >= 300 ? 'text-blue-400' :
                                            code.code >= 200 ? 'text-emerald-400' : 'text-gray-400'
                                    }`}>{code.code}</span>
                                <span className="font-bold text-sm tracking-wide uppercase text-foreground-muted">{code.title}</span>
                            </div>
                            <p className="text-sm text-foreground-secondary leading-snug">{code.desc}</p>
                        </div>
                    ))}
                </div>
                {filtered.length === 0 && <div className="text-center text-foreground-muted py-10">No codes found.</div>}
            </div>
        </ToolPane>
    );
};
