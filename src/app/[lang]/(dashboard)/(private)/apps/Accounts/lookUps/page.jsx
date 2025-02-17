//Remaining icons that will be sent through the backend.
//Responsivness


"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import crypto from 'crypto';
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

const LookupCategory = () => {
  const [categories, setCategories] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupForm, setPopupForm] = useState({ number: '', description: '' });
  const [selectedLindex, setSelectedLindex] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionId = localStorage.getItem('sessionID');
        if (!sessionId) {
          console.error('Session ID is not set in local storage.');
          return;
        }

        const encryptedParams = encryptData({ Index: 'H2pLEOilLM2AVL3u8DqC8HCpsC0Cwie6ZUiGepn2OD8=', Params: '' });
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
        console.log(parsedData);
        const categoriesArray = Object.keys(parsedData).map(key => parsedData[key]);
        setCategories(categoriesArray);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = async (lindex) => {
    try {
      const sessionId = localStorage.getItem('sessionID');
      if (!sessionId) {
        console.error('Session ID is not set in local storage.');
        return;
      }

      const encryptedParams = encryptData({ Index: lindex, Params: '' });
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
      console.log('Parsed Data on Click:', parsedData);
      setSelectedData(parsedData);
      setSelectedLindex(lindex); // Store the selected Lindex
    } catch (error) {
      console.error('Error fetching data on click:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Input Value:', inputValue);
  };

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    await sendDataTransRequest(isUpdate ? 1 : 0);
    setShowPopup(false);
    setIsUpdate(false);
    setSelectedItem(null);
  };

  const handleDelete = async (item) => {
    console.log('Delete initiated for item:', item);
    await sendDataTransRequest(2, item.id, item.number, item.description);
    console.log('Delete request sent for item:', item);
    setSelectedData(selectedData.filter(data => data.id !== item.id));
    console.log('Updated selectedData after delete:', selectedData);
  };

  const handleUpdate = (item) => {
    console.log('Update initiated for item:', item);
    setPopupForm({ number: item.number, description: item.description });
    setSelectedItem(item);
    setIsUpdate(true);
    setShowPopup(true);
  };

  const sendDataTransRequest = async (state, id = selectedItem?.id, number = popupForm.number, description = popupForm.description) => {
    try {
      const sessionId = localStorage.getItem('sessionID');
      if (!sessionId) {
        console.error('Session ID is not set in local storage.');
        return;
      }

      console.log('Preparing DataTrans request with state:', state);
      console.log('DataTrans params:', { id, number, description });

      const encryptedParams = encryptData({
        state: state,
        Index: selectedLindex, // Use the stored Lindex
        Params: `${id}#~${number}#~${description}`
      });

      console.log('Encrypted params:', encryptedParams);

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

      console.log('DataTrans Response:', response.data);
    } catch (error) {
      console.error('Error sending DataTrans request:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/4 bg-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Lookup Category</h2>
        <ul>
          {categories.map((category, index) => (
            <li key={category.Lindex || index} className="mb-2">
              <a
                href="#"
                className="flex items-center cursor-pointer"
                onClick={() => handleCategoryClick(category.Lindex)}
              >
               {category.icon && <i className={category.icon} />}
                {category.E_Lookup}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full md:w-3/4 p-4">
        {selectedData ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">Selected Data:</h3>
            <ul>
              {selectedData.map((item, index) => (
                <li key={index} className="mb-1 flex items-center">
                  <span className="font-bold flex-grow">{item.number}:</span>
                  <span className="flex-grow">{item.description}</span>
                  <div className="flex space-x-2">
                    {/* Update Icon */}
                    <FontAwesomeIcon
                      icon={faPencilAlt}
                      className="text-blue-500 cursor-pointer"
                      onClick={() => handleUpdate(item)}
                    />
                    {/* Delete Icon */}
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="text-red-500 cursor-pointer"
                      onClick={() => handleDelete(item)}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => {
                setShowPopup(true);
                setIsUpdate(false);
                setPopupForm({ number: '', description: '' });
              }}
            >
              Add Data
            </button>
            {showPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="bg-white p-6 rounded shadow-md w-80">
                  <h3 className="text-lg font-semibold mb-4">{isUpdate ? 'Update' : 'Add'} Data</h3>
                  <form onSubmit={handlePopupSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Number</label>
                      <input
                        type="text"
                        value={popupForm.number}
                        onChange={(e) => setPopupForm({ ...popupForm, number: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                      <input
                        type="text"
                        value={popupForm.description}
                        onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                        {isUpdate ? 'Update' : 'Submit'}
                      </button>
                      <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={() => setShowPopup(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-center p-4">
            <p className="text-lg">Please Choose a Category to Show Your Data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LookupCategory;
