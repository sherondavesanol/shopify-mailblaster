import React, { useEffect, useState } from 'react';
import { Modal, TextContainer, TextField } from '@shopify/polaris';

function ModalComponent({ authAxios, bestsellers, active, activator, email, name, handleChange }) {

  const [emailSubject, setEmailSubject] = useState('Bestseller Alert!');
  const [emailTitle, setEmailTitle] = useState('Hi, customer! Checkout our bestselling products:');
  const [emailContent, setEmailContent] = useState(`Bestselling Products: ${bestsellers}`);

  useEffect(() => {

    setEmailContent(`Bestselling Products: ${bestsellers}`);

    return () => setEmailContent(`Bestselling Products: ${bestsellers}`);
    
  }, [bestsellers]);

  const handleClose = () => {
    handleChange();
    setEmailSubject('Bestseller Alert!');
    setEmailTitle('Hi, customer! Checkout our bestselling products:');
    setEmailContent(`Bestselling Products: ${bestsellers}`);
  }

  const handleSendEmail = async(email, emailSubject, emailTitle, emailContent) => {

    email != null && 
    authAxios.post('/customers', {email, emailSubject, emailTitle, emailContent})
    .then(res => {
      // console.log(res);
      handleClose();
    })
    .catch(err => err);
  }

  const emailTitleChange = (e) => setEmailTitle(e);
  const emailContentChange = (e) => setEmailContent(e);
  const emailSubjectChange = (e) => setEmailSubject(e);
  
  return (
    <div style={{height: 'fit-content'}}>
      <Modal
        activator={activator}
        open={active}
        onClose={handleClose}
        title={`Send an email to ${name}`}
        primaryAction={{
          content: 'Send Email',
          onAction: () => {handleSendEmail(email, emailSubject, emailTitle, emailContent)}
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleClose,
            destructive: true
          }
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <TextField
              autoComplete="off"
              label="Email Subject"
              onChange={emailSubjectChange}
              placeholder="Input email subject"
              value={emailSubject}
            />
            <TextField
              autoComplete="off"
              label="Email Title"
              onChange={emailTitleChange}
              placeholder="Input email title"
              value={emailTitle}
            />
            <TextField
              autoComplete="off"
              label="Email Content"
              multiline={4}
              onChange={emailContentChange}
              value={emailContent}
            />
          </TextContainer>
        </Modal.Section>
      </Modal>
    </div>
  );
}

export default ModalComponent;