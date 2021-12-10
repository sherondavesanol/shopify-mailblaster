import "isomorphic-fetch";
import { gql } from "apollo-boost";

export function RECURRING_CREATE(url) {
  return gql`
    mutation {
      appSubscriptionCreate(
          name: "Pro Plan"
          returnUrl: "${url}"
          test: true
          lineItems: [
          {
            plan: {
              appUsagePricingDetails: {
                  cappedAmount: { amount: 77, currencyCode: USD }
                  terms: "$0.7 for 1000 emails"
              }
            }
          }
          {
            plan: {
              appRecurringPricingDetails: {
                  price: { amount: 77, currencyCode: USD }
              }
            }
          }
          ]
        ) {
            userErrors {
              field
              message
            }
            confirmationUrl
            appSubscription {
              id
            }
        }
    }`;
}

export const getSubscriptionPro = async (ctx, shop) => {

  const { client } = ctx;

  // console.log(client);

  const confirmationUrl = await client
    .mutate({
      mutation: RECURRING_CREATE(`${process.env.HOST}/auth?shop=${shop}`)
    })
    .then(response => response.data.appSubscriptionCreate.confirmationUrl);

  return confirmationUrl;
};
