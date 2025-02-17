"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import crypto from 'crypto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const key = process.env.NEXT_PUBLIC_AES_KEY;
const iv = process.env.NEXT_PUBLIC_AES_IV;
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

const resizeKey = (str, length) => {
  if (str.length > length) {
    return str.slice(0, length);
  } else if (str.length < length) {
    return str.padEnd(length, '\0');
  }
  return str;
};

const encrypt = (text, keyVal = key, ivVal = iv) => {
  const resizedKey = resizeKey(keyVal, 32);
  const resizedIV = resizeKey(ivVal, 16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(resizedKey, 'utf8'),
    Buffer.from(resizedIV, 'utf8')
  );
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

const decrypt = (encryptedText, keyVal = key, ivVal = iv) => {
  try {
    const resizedKey = resizeKey(keyVal, 32);
    const resizedIV = resizeKey(ivVal, 16);
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(resizedKey, 'utf8'),
      Buffer.from(resizedIV, 'utf8')
    );
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

const encryptData = (data) => {
  const jsonString = JSON.stringify(data);
  return encrypt(jsonString);
};

const CashRegForm = () => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]); // State for currency options
  const [formData, setFormData] = useState({
    id: '',
    number: '',
    name: '',
    openingCredit: '',
    openingDebit: '',
    date: '',
    rate: '',
    currency: 0,
    accountType: 0,
  });
  const [tableData, setTableData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Fetch account types
  useEffect(() => {
    const fetchAccountTypes = async () => {
      const encryptedParams = encryptData({
        Index: 'Argf73Umoi1+Jn4L4U0q8NqY/Gv+i386bMLXh1MwL5dTQV/iMEXP0w==',
        Params: ""
      });

      try {
        const response = await axios.post(
          'https://erpapi.tocan.com.ly/api/Home/GetDataSet',
          {
            body: encryptedParams,
            accessToken: ACCESS_TOKEN,
            sessionId: localStorage.getItem('sessionID')
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Token: API_TOKEN
            }
          }
        );
        const decryptedResponse = decrypt(response.data.ResultData);
        const parsedResponse = JSON.parse(decryptedResponse);
        console.log('Account Types API Response:', parsedResponse);

        // Assuming the response contains an array of account types
        setAccountTypes(parsedResponse || []);
      } catch (error) {
        console.error('Error fetching account types:', error);
      }
    };

    fetchAccountTypes();
  }, []);

  // Fetch currencies to populate the currency dropdown
  useEffect(() => {
    const fetchCurrencies = async () => {
      // Preparing the encrypted payload as specified
      const encryptedParams = encryptData({
        Index: "nbP1CHGw6f/nir2q8luij0LaIU03mndvkDfMffBB5mg=",
        Params: ""
      });

      try {
        const response = await axios.post(
          'https://erpapi.tocan.com.ly/api/Home/GetDataSet',
          {
            body: encryptedParams,
            accessToken: ACCESS_TOKEN,
            sessionId: localStorage.getItem('sessionID')
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Token: API_TOKEN
            }
          }
        );
        console.log('Response:', response.data);
        const decryptedResponse = decrypt(response.data.ResultData);
        const parsedResponse = JSON.parse(decryptedResponse);
        console.log('Currency API Response:', parsedResponse);

        // Assuming the response returns an array of currencies
        setCurrencies(parsedResponse || []);
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    fetchCurrencies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sessionId = localStorage.getItem('sessionID');
    const params = `${formData.id}#~${formData.number}#~${formData.name}#~${formData.openingCredit}#~${formData.openingDebit}#~${formData.date}#~${formData.rate}#~${formData.currency}#~${formData.accountType}`;

    const encryptedParams = encryptData({
      state: "0",
      Index: "9Gxa/++yB2qrhNM6zISaFg==",
      Params: params,
    });

    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionID: sessionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );
      console.log('Submit API Response:', response.data);
      // Handle success or error based on the response
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleViewTables = async () => {
    const encryptedParams = encryptData({
      Index: "Argf73Umoi1+Jn4L4U0q8PQ/d8u7pAgDxK46UtXQDhc=",
      Params: "3"
    });

    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/GetDataSet',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionId: localStorage.getItem('sessionID')
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );
      const decryptedResponse = decrypt(response.data.ResultData);
      const parsedResponse = JSON.parse(decryptedResponse);
      console.log('View Tables API Response:', parsedResponse);
      setTableData(parsedResponse);
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleUpdate = (item) => {
    setEditItem({
      ...item,
      accountType: item.class // Assuming 'class' is the account type ID
    });
    setShowEditPopup(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const sessionId = localStorage.getItem('sessionID');
    const params = `${editItem.id}#~${editItem.num}#~${editItem.name}#~${editItem.openingCredit}#~${editItem.openingDebit}#~${editItem.date}#~${editItem.rate}#~${editItem.amla}#~${editItem.accountType}`;
  
    const encryptedParams = encryptData({
      state: "1",
      Index: "9Gxa/++yB2qrhNM6zISaFg==",
      Params: params,
    });
  
    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionID: sessionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );
      console.log('Update API Response:', response.data);
      setShowEditPopup(false);
      setShowPopup(false);
      // Handle success or error based on the response
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };
  

  const handleDelete = async (item) => {
    const sessionId = localStorage.getItem('sessionID');
    const params = `${item.id}#~${item.num}#~${item.name}#~${item.daen}#~${item.mden}#~${item.s_date}#~${item.ex_rate}#~${item.omla_id}#~${item.typ_class}`;
  
    console.log('Delete Params:', params); // Log the params string
  
    const encryptedParams = encryptData({
      state: "2",
      Index: "9Gxa/++yB2r7leSJMWyxnA==",
      Params: params,
    });
  console.log(encryptedParams)
    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionID: sessionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );
      console.log('Delete API Response:', response.data);
      // Handle success or error based on the response
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  
  

  const closePopup = () => {
    setShowPopup(false);
    setShowEditPopup(false);
    setEditItem(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <img src="https://via.placeholder.com/30" alt="Logo" className="w-8 h-8 mr-2" />
          <span className="text-lg font-semibold">Cash Reg</span>
        </div>
        <select
          name="accountType"
          value={formData.accountType}
          onChange={handleChange}
          className="p-2 border border-gray-300 rounded w-full sm:w-auto"
        >
          {accountTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.acc_name}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Basic Info</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="ID"
              className="p-2 border border-gray-300 rounded w-full"
            />
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleChange}
              placeholder="Number"
              className="p-2 border border-gray-300 rounded w-full"
            />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              className="p-2 border border-gray-300 rounded w-full"
            />
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleChange}
              placeholder="MM/YY"
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Opening Balance</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded w-full"
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.description}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
              placeholder="Rate"
              className="p-2 border border-gray-300 rounded w-full"
            />
            <input
              type="text"
              name="openingCredit"
              value={formData.openingCredit}
              onChange={handleChange}
              placeholder="Opening Credit"
              className="p-2 border border-gray-300 rounded w-full"
            />
            <input
              type="text"
              name="openingDebit"
              value={formData.openingDebit}
              onChange={handleChange}
              placeholder="Opening Debit"
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded w-full sm:w-auto">
            Submit
          </button>
          <button type="button" className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full sm:w-auto">
            Cancel
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={handleViewTables}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        View Tables
      </button>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Table Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Number</th>
                    <th className="py-2 px-4 border-b">Name</th>
                    <th className="py-2 px-4 border-b">Opening Credit</th>
                    <th className="py-2 px-4 border-b">Opening Debit</th>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Rate</th>
                    <th className="py-2 px-4 border-b">Currency</th>
                    <th className="py-2 px-4 border-b">Account Type</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-4 border-b">{item.id}</td>
                      <td className="py-2 px-4 border-b">{item.num}</td>
                      <td className="py-2 px-4 border-b">{item.name}</td>
                      <td className="py-2 px-4 border-b">{item.daen}</td>
                      <td className="py-2 px-4 border-b">{item.mden}</td>
                      <td className="py-2 px-4 border-b">{item.s_date}</td>
                      <td className="py-2 px-4 border-b">{item.ex_rate}</td>
                      <td className="py-2 px-4 border-b">{item.omla_id}</td>
                      <td className="py-2 px-4 border-b">{item.typ_class}</td>
                      <td className="py-2 px-4 border-b flex justify-center space-x-2">
                        <button onClick={() => handleUpdate(item)} className="text-blue-500">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="text-red-500">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={closePopup}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showEditPopup && editItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Basic Info</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="id"
                    value={editItem.id}
                    onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                    placeholder="ID"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                  <input
                    type="text"
                    name="number"
                    value={editItem.num}
                    onChange={(e) => setEditItem({ ...editItem, num: e.target.value })}
                    placeholder="Number"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                  <input
                    type="text"
                    name="name"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    placeholder="Name"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                  <input
                    type="text"
                    name="date"
                    value={editItem.date}
                    onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                    placeholder="MM/YY"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Opening Balance</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    name="currency"
                    value={editItem.amla}
                    onChange={(e) => setEditItem({ ...editItem, amla: e.target.value })}
                    className="p-2 border border-gray-300 rounded w-full"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.description}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="rate"
                    value={editItem.rate}
                    onChange={(e) => setEditItem({ ...editItem, rate: e.target.value })}
                    placeholder="Rate"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                  <input
                    type="text"
                    name="openingCredit"
                    value={editItem.openingCredit}
                    onChange={(e) => setEditItem({ ...editItem, openingCredit: e.target.value })}
                    placeholder="Opening Credit"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                  <input
                    type="text"
                    name="openingDebit"
                    value={editItem.openingDebit}
                    onChange={(e) => setEditItem({ ...editItem, openingDebit: e.target.value })}
                    placeholder="Opening Debit"
                    className="p-2 border border-gray-300 rounded w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                <select
                  name="accountType"
                  value={editItem.accountType}
                  onChange={(e) => setEditItem({ ...editItem, accountType: e.target.value })}
                  className="p-2 border border-gray-300 rounded w-full"
                >
                  {accountTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.acc_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between mt-6">
                <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded w-full sm:w-auto">
                  Update
                </button>
                <button
                  type="button"
                  onClick={closePopup}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegForm;
