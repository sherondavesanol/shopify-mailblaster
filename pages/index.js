import React, { useEffect, useState } from 'react';
import { Badge, Page, Thumbnail, Layout } from "@shopify/polaris";
import Datatable from '../components/Datatable';
import useNavigate from 'react-router-dom';

const Index = ({authAxios}) => {

  const navigate = useNavigate();

  const bestsellers = [];

  const [customers, setCustomers] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [emailSubject] = useState('Bestseller Alert!');
  const [emailTitle] = useState('Hi, customer! Checkout our bestselling products:');
  const [emailContent, setEmailContent] = useState(`Bestselling Products: ${bestsellers}`); 

  useEffect(() => {

    authAxios.post('/billing')
    .then(res => {
      console.log(res.data);
      navigate(`./${res.data}`)
    });

    authAxios.get('/customers')
    .then(res => setCustomers(res.data.body.customers));

    authAxios.get('/orders')
    .then(res => res.data.body.orders.map(order => order.line_items.map(item => setOrderedItems(orderedItems => [...orderedItems, item.name.split(" - ")[0]]))));

    return () => {setCustomers([]), setOrderedItems([])};

  }, [authAxios]);

  useEffect(() => {

    setEmailContent(`Bestselling Products: ${bestsellers}`);

    return () => setEmailContent(`Bestselling Products: ${bestsellers}`);
    
  }, [bestsellers]);

  const handleClick = () => {
    
    customers.map(customer => {
      
      const email = customer.email;

      customer.email !== null && 
      authAxios.post('/customers', {email, emailSubject, emailTitle, emailContent})
      .then(res => res)
      .catch(err => err);
    });
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
    >
      <Layout>
        <Datatable authAxios={authAxios} bestsellers={bestsellers} customers={customers}/>
      </Layout>
    </Page>
  )
};

export default Index;