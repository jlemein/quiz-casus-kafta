# pull official base image
FROM node:alpine as react-build

# set working directory
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json .
COPY package-lock.json .
# --silent
RUN npm install
COPY . .
RUN npm run build

# -- container

FROM nginx:alpine

# nginx config
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

# static build
COPY --from=react-build /app/build /usr/share/nginx/html

# default port exposure
EXPOSE 80

# initialize environment variables into filesystem
WORKDIR /usr/share/nginx/html

# add bash
RUN apk add --no-cache bash
