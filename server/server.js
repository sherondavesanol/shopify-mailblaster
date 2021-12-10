import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import nodemailer from 'nodemailer';
import koaBody from 'koa-body';
import * as handlers from './handlers/index';

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SHOP: process.env.SHOP,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );


  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("/customers", async (ctx) => {

    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    const data = await client.get({
      path: 'customers'
    });

    ctx.status = 200;
    ctx.body = data;
  });

  router.get("/orders", async (ctx) => {

    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    const data = await client.get({
      path: 'orders'
    });

    ctx.status = 200;
    ctx.body = data;
  });

  router.post("/customers", koaBody(), async (ctx) => {

    const email = ctx.request.body.email;
    const emailSubject = ctx.request.body.emailSubject;
    const emailTitle = ctx.request.body.emailTitle;
    const emailContent = ctx.request.body.emailContent;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tildeshop2021@gmail.com',
            pass: 'tildestore_2021$'
        }
    });

    let message = {
        from: 'Tilde <tildeshop2021@gmail.com>',
        to: email,
        subject: emailSubject,
        html: `
        <div style="text-align: center; justify-content: center;">
        <h1>${emailTitle}</h1>
        <div>${emailContent}</div>
        </div>`
    }


    transporter.sendMail(message, (err, data)=> {
        if (err) {
          console.log("error in sending email", err)
          return "error";
        } else {
          console.log("success", data)
          return "success";
        } 
    });

    ctx.status = 200;
    ctx.body = 'Email sent!';
  });

  router.post("/billing", async (ctx) => {

    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    server.context.client = await handlers.createClient(session.shop, session.accessToken);
    const res = await handlers.getSubscriptionUrl(ctx, session.shop);

    ctx.status = 200;
    ctx.body = res;
  })

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {

    const shop =
      ctx.query.shop ||
      (await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res))?.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });
});
