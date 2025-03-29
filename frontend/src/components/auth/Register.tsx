import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import authService from '../Services/authService';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  age: number;
  fathersName: string;
  mothersName: string;
  phoneNo: string;
  place: string;
  district: string;
}

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register(data);
      navigate('/login');
    } catch (error) {
      console.error('Registration failed', error);
      alert('Registration failed: ' + (error as Error).message);
    }
  };

  const fields = [
    {
      name: 'username' as const,
      placeholder: 'Username',
      validation: { required: 'Username is required' }
    },
    {
      name: 'email' as const,
      placeholder: 'Email',
      validation: {
        required: 'Email is required',
        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
      }
    },
    {
      name: 'password' as const,
      placeholder: 'Password',
      type: 'password',
      validation: {
        required: 'Password is required',
        minLength: { value: 6, message: 'Password must be at least 6 characters' }
      }
    },
    {
      name: 'age' as const,
      placeholder: 'Age',
      type: 'number',
      validation: {
        required: 'Age is required',
        valueAsNumber: true,
        min: { value: 1, message: 'Age must be a positive number' }
      }
    },
    {
      name: 'fathersName' as const,
      placeholder: "Father's Name",
      validation: { required: "Father's name is required" }
    },
    {
      name: 'mothersName' as const,
      placeholder: "Mother's Name",
      validation: { required: "Mother's name is required" }
    },
    {
      name: 'phoneNo' as const,
      placeholder: 'Phone Number',
      validation: {
        required: 'Phone number is required',
        pattern: { value: /^\d{10}$/, message: 'Phone number must be 10 digits' }
      }
    },
    {
      name: 'place' as const,
      placeholder: 'Place',
      validation: { required: 'Place is required' }
    },
    {
      name: 'district' as const,
      placeholder: 'District',
      validation: { required: 'District is required' }
    }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {fields.map((field) => (
          <div key={field.name} className={field.name === 'email' || field.name === 'password' ? "sm:col-span-2" : ""}>
            <input
              {...register(field.name, field.validation)}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors[field.name] && (
              <span className="text-red-500 text-xs mt-0.5 block">
                {errors[field.name]?.message}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 text-sm font-medium mt-4"
      >
        Register
      </button>
    </form>
  );
};

export default Register;