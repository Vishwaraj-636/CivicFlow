import { useState } from "react";

const initialForm = {
   title: "",
   description: "",
   category: "",
   address: "",
   location: null,
};

const initialMedia = {
   images: [],
   videos: [],
};

const getValue = (input) => input?.target?.value ?? input;

const useComplaintForm = () => {
   const [form, setForm] = useState(initialForm);
   const [media, setMedia] = useState(initialMedia);

   const handleForm = (event) => {
      const { name, value } = event.target;
      setForm((previousForm) => ({ ...previousForm, [name]: value }));
   };

   const handleTitle = (value) => {
      setForm((previousForm) => ({ ...previousForm, title: getValue(value) }));
   };

   const handleDescription = (value) => {
      setForm((previousForm) => ({ ...previousForm, description: getValue(value) }));
   };

   const handleCategory = (value) => {
      setForm((previousForm) => ({ ...previousForm, category: getValue(value) }));
   };

   const handleLocation = async (value) => {
      setForm((previousForm) => ({ ...previousForm, location: value }));

      // Auto-fill address using Reverse Geocoding
      if (value && value.latitude && value.longitude) {
         try {
            const response = await fetch(
               `https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.latitude}&lon=${value.longitude}`
            );
            const data = await response.json();
            if (data && data.display_name) {
               setForm((previousForm) => ({ ...previousForm, address: data.display_name }));
            }
         } catch (error) {
            console.error("Failed to fetch address:", error);
         }
      }
   };

   const handleMedia = (value) => {
      setMedia({
         images: value?.images ?? [],
         videos: value?.videos ?? [],
      });
   };

   const handlerResetForm = () => {
      setForm({ ...initialForm });
      setMedia({ images: [], videos: [] });
   };

   return {
      form,
      media,
      handleTitle,
      handleDescription,
      handleCategory,
      handleLocation,
      handleMedia,
      handleForm,
      handlerResetForm,
   };
};

export default useComplaintForm;
