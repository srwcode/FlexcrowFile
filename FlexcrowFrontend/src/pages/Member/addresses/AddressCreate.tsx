import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface AddressFormData {
  name: string;
  type: 1 | 2;
  full_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  subdistrict: string;
  district: string;
  province: string;
  country: string;
  postal_code: string;
}

const AddressCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
    "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", 
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", 
    "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Congo (Congo-Kinshasa)", 
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Denmark", "Djibouti", "Dominica", 
    "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", 
    "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
    "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", 
    "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
    "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", 
    "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", 
    "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", 
    "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", 
    "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", 
    "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
    "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", 
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
    "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
    "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", 
    "Yemen", "Zambia", "Zimbabwe"
  ];

  const [formData, setFormData] = React.useState<AddressFormData>({
    name: '',
    type: 1,
    full_name: '',
    phone: '',
    address_1: '',
    address_2: '',
    subdistrict: '',
    district: '',
    province: '',
    country: 'Thailand',
    postal_code: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!formData.type || (formData.type !== 1 && formData.type !== 2)) {
      newErrors.type = 'Type must be New or Used';
    }

    if (!formData.full_name) newErrors.full_name = 'Recipient’s Name is required';
    else if (formData.full_name.length < 2 || formData.full_name.length > 100) {
      newErrors.full_name = 'Recipient’s Name must be 2-100 characters';
    }

    const phoneRegex = /^\+?[0-9]{3,}$/;

    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.address_1) newErrors.address_1 = 'Address 1 is required';
    if (formData.address_1.length > 1000) {
      newErrors.address_1 = 'Address 1 must not exceed 1,000 characters';
    }

    if (formData.address_2.length > 1000) {
      newErrors.address_2 = 'Address 2 must not exceed 1,000 characters';
    }

    if (!formData.subdistrict) newErrors.subdistrict = 'Subdistrict is required';
    if (formData.subdistrict.length > 100) {
      newErrors.subdistrict = 'Subdistrict must not exceed 100 characters';
    }

    if (!formData.district) newErrors.district = 'District is required';
    if (formData.district.length > 100) {
      newErrors.district = 'District must not exceed 100 characters';
    }

    if (!formData.province) newErrors.province = 'Province is required';
    if (formData.province.length > 100) {
      newErrors.province = 'Province must not exceed 100 characters';
    }

    if (!formData.country) newErrors.country = 'Country is required';
    if (formData.country.length > 100) {
      newErrors.country = 'Country must not exceed 100 characters';
    }

    if (!formData.postal_code) newErrors.postal_code = 'Postal code is required';
    else if (!/^\d+$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Invalid postal code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      status: 1
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'user_error') {
          setErrors((prev) => ({ ...prev, user_id: 'User not found' }));
        } else {
          throw new Error(responseData.error || 'Failed to create address');
        }
        return;
      }

      toast.success('Address created successfully');
      navigate('/member/addresses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address');
    }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";
  const selectClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Create New Address</h1>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 my-4 rounded shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Address Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Home, Office, Parent's House"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Type</label>
                <div className="flex space-x-6 mt-3">
                  <div className="relative flex items-center">
                    <input
                      id="type-home"
                      type="radio"
                      name="type"
                      checked={formData.type === 1}
                      onChange={() => setFormData({ ...formData, type: 1 })}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full border ${formData.type === 1 ? 'border-teal-600' : 'border-gray-400'}`}>
                      {formData.type === 1 && (
                        <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                      )}
                    </span>
                    <label htmlFor="type-home" className={`ml-2 block text-sm cursor-pointer ${formData.type === 1 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>Home</label>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="type-workplace"
                      type="radio"
                      name="type"
                      checked={formData.type === 2}
                      onChange={() => setFormData({ ...formData, type: 2 })}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full border ${formData.type === 2 ? 'border-teal-600' : 'border-gray-400'}`}>
                      {formData.type === 2 && (
                        <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                      )}
                    </span>
                    <label htmlFor="type-workplace" className={`ml-2 block text-sm cursor-pointer ${formData.type === 2 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>Workplace</label>
                  </div>
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Recipient's Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className={inputClass}
                  placeholder="Full Name"
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+66XXXXXXXXX"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Location Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Address 1</label>
                <input
                  type="text"
                  value={formData.address_1}
                  onChange={e => setFormData({ ...formData, address_1: e.target.value })}
                  className={inputClass}
                  placeholder="Street address, building, house no."
                />
                {errors.address_1 && <p className="text-red-500 text-xs mt-1">{errors.address_1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Address 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.address_2}
                  onChange={e => setFormData({ ...formData, address_2: e.target.value })}
                  className={inputClass}
                  placeholder="Apartment, suite, unit, etc."
                />
                {errors.address_2 && <p className="text-red-500 text-xs mt-1">{errors.address_2}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Subdistrict</label>
                  <input
                    type="text"
                    value={formData.subdistrict}
                    onChange={e => setFormData({ ...formData, subdistrict: e.target.value })}
                    className={inputClass}
                  />
                  {errors.subdistrict && <p className="text-red-500 text-xs mt-1">{errors.subdistrict}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className={inputClass}
                  />
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className={inputClass}
                  />
                  {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                    className={inputClass}
                  />
                  {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    className={selectClass}
                  >
                    {countries.map((country, index) => (
                      <option key={index} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              className="px-6 py-2 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/member/addresses')}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressCreate;