# Soleia — site statique (prototypes) servi par nginx
FROM nginx:alpine

# Le contenu du dossier site/ devient la racine web.
# nginx sert automatiquement index.html, ainsi que /a/ /b/ /c/ (dossiers).
COPY site/ /usr/share/nginx/html/

EXPOSE 80
