# Authentication and Authorization

The Graph Explorer UI does not have built-in support for any user authentication or authorization.

Anyone with access to the service URL can access the graph data (even if Neptune database instances are locked down, because the UI is not). This is a security issue if the data is sensitive.

Authentication can be added by putting Graph Explorer behind an Nginx reverse proxy server. The Graph Explorer route should only be accessible by Nginx. Nginx can then be configured to add authentication.


## HTTP Basic Authentication

Nginx natively supports HTTP Basic Authentication.

Minimal example Nginx configuration:

```nginx
server {

  location / {
    auth_basic "Graph Explorer Login";
    auth_basic_user_file /etc/nginx/auth/htpasswd;

    set $upstream_graph_explorer graph_explorer.svc.cluster.local:8080;
    proxy_pass http://$upstream_graph_explorer;
  }

}
```

The example configuration assumes that Graph Explorer is running on `http://graph_explorer.svc.cluster.local:8080`, which is only accessible to Nginx.

Create and mount a `/etc/nginx/auth/htpasswd` file on the Nginx pod or server. Passwords can be generated using `pwgen` and encoded using `openssl passwd`.

Example `htpasswd` file contents:

```
# password file
# format USER:PASSWORD:COMMENT
admin:$1$OasDSiq8$E6lJaEHz0rjM5DXj2GwZv.
# username: admin; password: admin
```


## LDAP and Active Directory Authentication

Nginx lacks built-in support for LDAP and Active Directory authentication.

The [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html) module for Nginx can be used to implement client authorization based on the result of a sub-request to another service.

An `nginx-ldap-auth-service` deployment (a project developed and used at Caltech) can be used to authenticate users against LDAP and Active Directory.

References for `nginx-ldap-auth-service`:

- [Documentation](https://nginx-ldap-auth-service.readthedocs.io)
- [Container registry](https://hub.docker.com/r/caltechads/nginx-ldap-auth-service)
- [Source code](https://github.com/caltechads/nginx-ldap-auth-service)

The `nginx-ldap-auth-service` service is configured using environment variables. Please the [environment documentation](https://nginx-ldap-auth-service.readthedocs.io/en/latest/configuration.html#environment) for details on configuring the service.

Minimal example Nginx configuration:

```nginx
server {

  location / {
    auth_request /check-auth;

    # If the auth service returns a 401, redirect to the login page.
    error_page 401 =200 /auth/login?service=$request_uri;

    set $upstream_app APP_SERVICE_NAME.APP_NAMESPACE.svc.cluster.local:8080;
    proxy_pass http://$upstream_app;
  }

  location /auth {
    set $upstream_graph_ldap LDAP_SERVICE_NAME.LDAP_SERVICE_NAMESPACE.svc.cluster.local:8888;
    proxy_pass http://$upstream_ldap;

    proxy_set_header X-Cookie-Name "nginxauth";
    proxy_set_header X-Cookie-Domain "NGINX_GATEWAY_DOMAIN";
    proxy_set_header X-Auth-Realm "Restricted Area";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Cookie nginxauth_csrf=$cookie_nginxauth_csrf;
  }

  location /check-auth {
    internal;

    set $upstream_graph_ldap LDAP_SERVICE_NAME.LDAP_SERVICE_NAMESPACE.svc.cluster.local:8888;
    proxy_pass http://$upstream_ldap/check;

    proxy_pass_request_headers off;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";

    proxy_ignore_headers "Set-Cookie";
    proxy_hide_header "Set-Cookie";

    proxy_set_header X-Cookie-Name "nginxauth";
    proxy_set_header X-Cookie-Domain "NGINX_GATEWAY_DOMAIN";
    proxy_set_header Cookie nginxauth=$cookie_nginxauth;
  }

}
```

The example configuration assumes that Graph Explorer on running on an internal `http://APP_SERVICE_NAME.APP_NAMESPACE.svc.cluster.local:8080` route and that the auth service is running on `http://LDAP_SERVICE_NAME.LDAP_SERVICE_NAMESPACE.svc.cluster.local:8888`.
