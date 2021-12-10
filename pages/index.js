import React, { useEffect, useState } from 'react';
import { Badge, Page, Thumbnail, Layout } from "@shopify/polaris";
import Datatable from '../components/Datatable';

const Index = ({authAxios}) => {

  const bestsellers = [];

  const [customers, setCustomers] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [emailSubject] = useState('Bestseller Alert!');
  const [emailTitle] = useState('Hi, customer! Checkout our bestselling products:');
  const [emailContent, setEmailContent] = useState(`Bestselling Products: ${bestsellers}`); 

  useEffect(() => {

    authAxios.get('/customers')
    .then(res => setCustomers(res.data.body.customers));

    authAxios.get('/orders')
    .then(res => res.data.body.orders.map(order => order.line_items.map(item => setOrderedItems(orderedItems => [...orderedItems, item.name.split(" - ")[0]]))));

    authAxios.get('/subscriptions')
    .then(res => {

      const subscriptions = res.data.body.recurring_application_charges;
      const length = res.data.body.recurring_application_charges.length;

      for (let i = 0; i < length; i++) {

        if (subscriptions[i].status !== "active") {
          continue;
        } else {
          setSubscription(subscriptions[i].name);
          break;
        }
      }
    });

    return () => {setCustomers([]), setOrderedItems([]), setSubscription(null)};

  }, [authAxios]);

  useEffect(() => {

    setEmailContent(`Bestselling Products: ${bestsellers}`);

    return () => setEmailContent(`Bestselling Products: ${bestsellers}`);
    
  }, [bestsellers]);

  const handleClick = () => {

    subscription == null
    ? ( authAxios.post('/billing')
    .then(res => {
      window.parent.location.href = res.data;
    })) : (
      customers.map(customer => {
        
        const email = customer.email;
  
        customer.email !== null && 
        authAxios.post('/customers', {email, emailSubject, emailTitle, emailContent})
        .then(res => res)
        .catch(err => err);
      })
    )
  };

  orderedItems.length > 0 && orderedItems.forEach(item => {
    if (orderedItems.indexOf(item) === orderedItems.lastIndexOf(item)) return;
    if (bestsellers.includes(item)) return;
    bestsellers.push(item);
  });

  return (
    <Page
      title='Mailblaster'
      titleMetadata={<Badge status='success' progress='complete' size='small' statusAndProgressLabelOverride='Mailblaster'>Bulk Email Sender</Badge>}
      subtitle="Send bestseller product list to customers"
      thumbnail={
        <Thumbnail
          source="https://miro.medium.com/max/300/0*Gud_GpaYbRDqdueh.png"
          alt="Mailblaster Image"
        />
      }
      compactTitle
      primaryAction={{
        content: 'Send Email to All',
        onAction: handleClick,
        loading: bestsellers == null ? true : false
      }}
      secondaryActions={{
        content: 'Cancel Subscription',
        destructive: true,
        onaction: () => console.log('test'),
        loading: bestsellers == null ? true : false
      }}
    >
      <Layout>
        <Datatable authAxios={authAxios} bestsellers={bestsellers} customers={customers} subscription={subscription}/>
      </Layout>
    </Page>
  )
};

export default Index;