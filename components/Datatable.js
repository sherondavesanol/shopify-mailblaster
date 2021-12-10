import { Button, Card, DataTable, Page } from '@shopify/polaris';
import React, { useCallback, useState } from 'react';
import ModalButton from './ModalButton';

function Datatable({authAxios, bestsellers, customers, subscription}) {

    const [sortedRows, setSortedRows] = useState(null);

    function sortCurrency(rows, index, direction) {

        return customers.length !== 0 && [...rows].sort((rowA, rowB) => {
            const amountA = parseFloat(rowA[index]);
            const amountB = parseFloat(rowB[index]);

            return direction === 'descending' ? amountB - amountA : amountA - amountB;
        });
    }
  
    const initiallySortedRows = customers.map(customer => [
        customer.email, 
        customer.first_name, 
        customer.last_name, 
        customer.orders_count, 
        `${customer.total_spent} PHP`, 
        <ModalButton authAxios={authAxios} email={customer.email} name={customer.first_name} bestsellers={bestsellers} subscription={subscription} />  
    ]);

    const rows = sortedRows ? sortedRows : initiallySortedRows;
  
    const handleSort = useCallback(
      (index, direction) => setSortedRows(sortCurrency(rows, index, direction)),
      [rows],
    );
  
    return (
      <Page title="Customers Datatable">
        <Card>
          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'text',
              'numeric',
              'numeric',
              'text'
            ]}
            headings={[
              'Email',
              'First Name',
              'Last Name',
              'Orders Count',
              'Total Spent',
              'Send Email'
            ]}
            rows={rows}
            sortable={[false, false, false, true, true]}
            defaultSortDirection="descending"
            initialSortColumnIndex={4}
            onSort={handleSort}
          />
        </Card>
      </Page>
    );
}

export default Datatable;