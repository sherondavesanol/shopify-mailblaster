import React, { useCallback, useState } from 'react';
import { Button } from '@shopify/polaris';
import ModalComponent from './ModalComponent';

function ModalButton({ authAxios, bestsellers, email, name, subscription }) {

        const [active, setActive] = useState(false);
        const handleChange = useCallback(() => setActive(!active), [active]);
        const activator = <Button onClick={handleChange}>Send Email</Button>;

        return (
                <>
                        <ModalComponent 
                                authAxios={authAxios}
                                bestsellers={bestsellers}
                                activator={activator}
                                handleChange={handleChange}
                                active={active}
                                email={email}
                                name={name}
                                subscription={subscription}
                        />
                </>
        )
}

export default ModalButton
