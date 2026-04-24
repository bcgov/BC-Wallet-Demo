:{{ .Values.showcase.frontend.containerPort }} {
    header {
        Content-Security-Policy {{ .Values.showcase.frontend.contentSecurityPolicy | quote }};
        Strict-Transport-Security "max-age=86400; includeSubDomains";
        X-Content-Type-Options "nosniff";
        X-XSS-Protection 1;
        X-Frame-Options DENY;
    }
    log {
        output stdout
    }
    root * /srv
    file_server
    # baseRoute from Helm (not {$VITE_BASE_ROUTE}) so Caddy matches SPA + /demo/socket before upstream.
    @encode_static {
        not path {{ .Values.showcase.baseRoute }}/demo/* {{ .Values.showcase.baseRoute }}/server/* {{ .Values.showcase.baseRoute }}/agent/* {{ .Values.showcase.baseRoute }}/public/* {{ .Values.showcase.baseRoute }}/qr
    }
    encode @encode_static zstd gzip
    # No global `templates` — Engine.IO polling bodies can break the templates handler.
    vars * basePath {{ .Values.showcase.baseRoute }}
    handle /health {
        respond 200
    }
    # path_regexp so /demo does not swallow /demo/socket (Socket.IO polling).
    @demo_root path_regexp demoRoot ^{{ .Values.showcase.baseRoute }}/demo/?$
    handle @demo_root {
        redir {vars.basePath}
    }
    @dashboard_root path_regexp dashboardRoot ^{{ .Values.showcase.baseRoute }}/dashboard/?$
    handle @dashboard_root {
        redir {vars.basePath}
    }
    handle {{ .Values.showcase.baseRoute }}* {
        @websockets {
            header Connection *Upgrade*
            header Upgrade    websocket
        }
        reverse_proxy @websockets {$SHOWCASE_API_UPSTREAM} {
            header_up Host {{ include "showcase.server.fullname" . }}:{{ .Values.showcase.server.containerPort }}
        }
        @spa_router {
            not path {{ .Values.showcase.baseRoute }}/demo/* {{ .Values.showcase.baseRoute }}/server/* {{ .Values.showcase.baseRoute }}/agent/ready {{ .Values.showcase.baseRoute }}/public/* {{ .Values.showcase.baseRoute }}/qr
            file {
                try_files {path} /index.html
            }
        }
        rewrite @spa_router {http.matchers.file.relative}
        @pass {
            path {{ .Values.showcase.baseRoute }}/demo/* {{ .Values.showcase.baseRoute }}/server/* {{ .Values.showcase.baseRoute }}/agent/ready {{ .Values.showcase.baseRoute }}/public/* {{ .Values.showcase.baseRoute }}/qr
        }
        reverse_proxy @pass {$SHOWCASE_API_UPSTREAM} {
            trusted_proxies {{ .Values.showcase.frontend.trustedProxies }}
            # Stable Host for API (TCP dial uses ClusterIP from SHOWCASE_API_UPSTREAM service-link expansion).
            header_up Host {{ include "showcase.server.fullname" . }}:{{ .Values.showcase.server.containerPort }}
            header_up X-Forwarded-Host {host}
        }
    }
    handle {
        redir {vars.basePath}
    }
}
