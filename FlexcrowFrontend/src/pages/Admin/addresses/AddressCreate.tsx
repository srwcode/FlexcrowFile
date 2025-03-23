import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface AddressFormData {
  user_id: string;
  name: string;
  status: 1 | 2;
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
    user_id: '',
    name: '',
    status: 1,
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

    if (!formData.user_id) newErrors.user_id = 'User is required';

    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!formData.status || (formData.status !== 1 && formData.status !== 2)) {
      newErrors.status = 'Status must be Active or Inactive';
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
      ...formData
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
      navigate('/admin/addresses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address');
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Address</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2">User</label>
            <input
                type="text"
                value={formData.user_id}
                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.user_id && <p className="text-red-500 text-sm mt-2">{errors.user_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Name</label>
            <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
          </div>

          <div>
            <label className="block mb-2">Status</label>
            <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: Number(e.target.value) as 1 | 2 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Active</option>
                <option value="2">Inactive</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-2">{errors.status}</p>}
          </div>

          <div>
            <label className="block mb-2">Type</label>
            <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: Number(e.target.value) as 1 | 2 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Home</option>
                <option value="2">Workplace</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-2">{errors.type}</p>}
          </div>

          <div>
            <label className="block mb-2">Recipient’s Name</label>
            <input
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.full_name && <p className="text-red-500 text-sm mt-2">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block mb-2">Phone</label>
            <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
          </div>

          <div>
            <label className="block mb-2">Address 1</label>
            <input
                type="text"
                value={formData.address_1}
                onChange={e => setFormData({ ...formData, address_1: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.address_1 && <p className="text-red-500 text-sm mt-2">{errors.address_1}</p>}
          </div>

          <div>
            <label className="block mb-2">Address 2</label>
            <input
              type="text"
              value={formData.address_2}
              onChange={e => setFormData({ ...formData, address_2: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.address_2 && <p className="text-red-500 text-sm mt-2">{errors.address_2}</p>}
          </div>

          <div>
            <label className="block mb-2">Subdistrict</label>
            <input
              type="text"
              value={formData.subdistrict}
              onChange={e => setFormData({ ...formData, subdistrict: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.subdistrict && <p className="text-red-500 text-sm mt-2">{errors.subdistrict}</p>}
          </div>

          <div>
            <label className="block mb-2">District</label>
            <input
              type="text"
              value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.district && <p className="text-red-500 text-sm mt-2">{errors.district}</p>}
          </div>

          <div>
            <label className="block mb-2">Province</label>
            <input
              type="text"
              value={formData.province}
              onChange={e => setFormData({ ...formData, province: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.province && <p className="text-red-500 text-sm mt-2">{errors.province}</p>}
          </div>

          <div>
            <label className="block mb-2">Country</label>
            <select
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Select a country</option>
              {countries.map((country, index) => (
                <option key={index} value={country}>{country}</option>
              ))}
            </select>
            {errors.country && <p className="text-red-500 text-sm mt-2">{errors.country}</p>}
          </div>

          <div>
            <label className="block mb-2">Postal code</label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.postal_code && <p className="text-red-500 text-sm mt-2">{errors.postal_code}</p>}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-600"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/addresses')}
              className="bg-gray-500 text-white px-4 py-2 mt-4 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default AddressCreate;