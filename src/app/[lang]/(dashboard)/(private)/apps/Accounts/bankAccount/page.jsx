"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import crypto from 'crypto';
import toast, { Toaster } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';

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

const initialFormData = {
  id: '',
  accountNo: '',
  bankId: '',
  date: null,
  balance: '',
  notes: '',
  rate: '',
  IBAN_NO: '',
  SWIFT_CODE: '',
  companyId: '',
  currencyId: ''
};

const formatDate = (date) => {
  if (!date) return '';
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);
  return `${month < 10 ? '0' + month : month}/${year}`;
};

const BankAccountForm = () => {
  const [companies, setCompanies] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [banks, setBanks] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState('');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState('');

  const validateForm = () => {
    if (!formData.accountNo.trim()) {
      toast.error("Account number is required.");
      return false;
    }
    if (!formData.bankId) {
      toast.error("Bank is required.");
      return false;
    }
    if (!formData.date) {
      toast.error("Date is required.");
      return false;
    }
    if (!formData.balance.trim()) {
      toast.error("Opening balance is required.");
      return false;
    }
    if (isNaN(parseFloat(formData.balance))) {
      toast.error("Opening balance must be a number.");
      return false;
    }
    if (!formData.currencyId) {
      toast.error("Currency is required.");
      return false;
    }
    if (!formData.rate.trim()) {
      toast.error("Rate is required.");
      return false;
    }
    if (isNaN(parseFloat(formData.rate))) {
      toast.error("Rate must be a number.");
      return false;
    }
    if (!formData.companyId) {
      toast.error("Company is required.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchData = async (index, setState) => {
      try {
        const sessionId = localStorage.getItem('sessionID');
        if (!sessionId) {
          console.error('Session ID is not set in local storage.');
          return;
        }

        const encryptedParams = encryptData({ Index: index, Params: '' });
        const response = await axios.post(
          'https://erpapi.tocan.com.ly/api/Home/GetDataset',
          {
            body: encryptedParams,
            accessToken: ACCESS_TOKEN,
            sessionId: sessionId
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Token: API_TOKEN
            }
          }
        );
        const decryptedData = decrypt(response.data.ResultData);
        const parsedData = JSON.parse(decryptedData);
        setState(parsedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData('NrwmTknEaJYYX0RKar+pYZUOVVg5SqH4', setCompanies);
    fetchData('nbP1CHGw6f/nir2q8luij0LaIU03mndvkDfMffBB5mg=', setCurrencies);
    fetchData('3L0TFx9ZMMq9RfPfdIlRGw==', setBanks);
  }, []);

  const handleViewTable = async () => {
    try {
      const sessionId = localStorage.getItem('sessionID');
      if (!sessionId) {
        console.error('Session ID is not set in local storage.');
        return;
      }

      const encryptedParams = encryptData({
        Index: 'RvzzYt+zp4x66YTCcTayersF5+9e+30JD85a78AqSvQ=',
        Params: '0#0'
      });

      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/GetDataset',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionId: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );

      const decryptedData = decrypt(response.data.ResultData);
      const parsedData = JSON.parse(decryptedData);
      setTableData(parsedData);
      setShowTable(true);
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const sessionId = localStorage.getItem('sessionID');
      if (!sessionId) {
        console.error('Session ID is not set in local storage.');
        return;
      }
      const formattedDate = formatDate(formData.date);

      const stateVal = selectedItem ? 1 : 0;
      const encryptedParams = encryptData({
        state: stateVal,
        Index: 'lzxagCKk3hN8VYjyNEJgSw==',
        Params: `${formData.id}#~${formData.accountNo}#~${formData.bankId}#~${formattedDate}#~${formData.balance}#~${formData.notes}#~${formData.rate}#~${formData.IBAN_NO}#~${formData.SWIFT_CODE}#~${formData.companyId}#~${formData.currencyId}`
      });

      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionId: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );

      toast.success("Data submitted successfully!");
      setFormData(initialFormData);
      setShowUpdateForm(false);
      setSelectedItem(null);
      handleViewTable();
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error("Failed to submit data.");
    }
  };

  const handleUpdate = (item) => {
    let dateObj = null;
    if (item.dte) {
      const date = new Date(item.dte);
      dateObj = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    setFormData({
      id: item.id,
      accountNo: item.num,
      bankId: item.bank_id,
      date: dateObj,
      balance: item.balance,
      notes: item.nots,
      rate: item.ex_rate,
      IBAN_NO: item.IBAN_NO,
      SWIFT_CODE: item.SWIFT_CODE,
      companyId: item.company_id,
      currencyId: item.Curr_id // Ensure this matches the ID in the currencies array
    });

    setSelectedItem(item);
    setShowUpdateForm(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const sessionId = localStorage.getItem('sessionID');
      if (!sessionId) {
        console.error('Session ID is not set in local storage.');
        return;
      }

      const params = `${itemToDelete.id}#~${itemToDelete.num}#~${itemToDelete.bank_id}#~${itemToDelete.dte}#~${itemToDelete.balance}#~${itemToDelete.nots}#~${itemToDelete.ex_rate}#~${itemToDelete.IBAN_NO}#~${itemToDelete.SWIFT_CODE}#~${itemToDelete.company_id}#~${itemToDelete.Curr_id}`;
      const encryptedParams = encryptData({
        state: 2,
        Index: 'lzxagCKk3hN8VYjyNEJgSw==',
        Params: params
      });

      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedParams,
          accessToken: ACCESS_TOKEN,
          sessionId: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Token: API_TOKEN
          }
        }
      );
      toast.success("Data deleted successfully!");
      handleViewTable();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error("Failed to delete data.");
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  const filteredTableData = tableData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      (item.num && item.num.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower));
    const matchesBank =
      selectedBankFilter === '' ||
      (item.description && item.description === selectedBankFilter);
    const matchesCurrency =
      selectedCurrencyFilter === '' ||
      (item.curr_name && item.curr_name === selectedCurrencyFilter);
    return matchesSearch && matchesBank && matchesCurrency;
  }).map(row => ({
    ...row,
    balance: parseFloat(row.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    Column1: parseFloat(row.Column1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }));

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md relative">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Basic Info</h2>
      {!showUpdateForm ? (
        <>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">Account No</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="985"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                />
              </div>
              <div className="w-full md:w-1/2 pl-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Bank Name</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.bankId}
                  onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  dateFormat="MM/yy"
                  showMonthYearPicker
                  placeholderText="MM/YY"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-full md:w-1/2 pl-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Opening Balance</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="1,000,000 $"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">Currency</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.currencyId}
                  onChange={(e) => setFormData({ ...formData, currencyId: e.target.value })}
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-1/2 pl-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Rate</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="1.000"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">IBAN/ NO.</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.IBAN_NO}
                  onChange={(e) => setFormData({ ...formData, IBAN_NO: e.target.value })}
                />
              </div>
              <div className="w-full md:w-1/2 pl-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Swift Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.SWIFT_CODE}
                  onChange={(e) => setFormData({ ...formData, SWIFT_CODE: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">Company</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-1/2 pl-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-end mt-6 space-y-4 md:space-y-0 md:space-x-4">
              <button type="submit" className="px-6 py-2 bg-indigo-500 text-white rounded-lg">
                Submit
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg"
                onClick={() => setFormData(initialFormData)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-green-500 text-white rounded-lg"
                onClick={handleViewTable}
              >
                View Table
              </button>
            </div>
          </form>

          {showTable && (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-50 p-4 overflow-auto">
              <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl">
                <h3 className="text-lg font-semibold mb-4 text-center">Data Table</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
                  <input
                    type="text"
                    placeholder="Search by account or bank name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-1/3"
                  />
                  <div className="flex space-x-4">
                    <select
                      value={selectedBankFilter}
                      onChange={(e) => setSelectedBankFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Banks</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.description}>
                          {bank.description}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedCurrencyFilter}
                      onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Currencies</option>
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.description}>
                          {currency.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Account Number</th>
                        <th className="py-2 px-4 border-b">Currency</th>
                        <th className="py-2 px-4 border-b">Bank Name</th>
                        <th className="py-2 px-4 border-b">State</th>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Bank Opening Balance</th>
                        <th className="py-2 px-4 border-b">Current Balance</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableData.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="py-2 px-4">{row.num}</td>
                          <td className="py-2 px-4">{row.curr_name}</td>
                          <td className="py-2 px-4">{row.description}</td>
                          <td className="py-2 px-4">{row.nots}</td>
                          <td className="py-2 px-4">{new Date(row.dte).toLocaleDateString()}</td>
                          <td className="py-2 px-4">{row.Column1}</td>
                          <td className="py-2 px-4">{row.balance}</td>
                          <td className="py-2 px-4 flex space-x-2 justify-center">
                            <FontAwesomeIcon
                              icon={faPencilAlt}
                              className="text-blue-500 cursor-pointer"
                              onClick={() => handleUpdate(row)}
                            />
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="text-red-500 cursor-pointer"
                              onClick={() => handleDeleteClick(row)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg block mx-auto"
                  onClick={() => setShowTable(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Update Info</h2>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label className="block text-gray-700 text-sm font-bold mb-2">Account No</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="985"
                value={formData.accountNo}
                onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
              />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Bank Name</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                dateFormat="MM/yy"
                showMonthYearPicker
                placeholderText="MM/YY"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Opening Balance</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="1,000,000 $"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label className="block text-gray-700 text-sm font-bold mb-2">Currency</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.currencyId}
                onChange={(e) => setFormData({ ...formData, currencyId: e.target.value })}
              >
                <option value="">Select Currency</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Rate</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="1.000"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label className="block text-gray-700 text-sm font-bold mb-2">IBAN/ NO.</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.IBAN_NO}
                onChange={(e) => setFormData({ ...formData, IBAN_NO: e.target.value })}
              />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Swift Code</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.SWIFT_CODE}
                onChange={(e) => setFormData({ ...formData, SWIFT_CODE: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label className="block text-gray-700 text-sm font-bold mb-2">Company</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end mt-6 space-y-4 md:space-y-0 md:space-x-4">
            <button type="submit" className="px-6 py-2 bg-indigo-500 text-white rounded-lg">
              Update
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg"
              onClick={() => {
                setShowUpdateForm(false);
                setFormData(initialFormData);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this item?</p>
            <div className="flex justify-between mt-6">
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto mr-2"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  setItemToDelete(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

export default BankAccountForm;
