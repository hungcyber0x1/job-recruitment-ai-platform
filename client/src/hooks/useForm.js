import { useState } from 'react';

const useForm = (initialValues = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors(err.response?.data?.errors || { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setValues(initialValues);

  return {
    values,
    setValues,
    errors,
    loading,
    handleChange,
    handleSubmit,
    resetForm,
  };
};

export default useForm;
