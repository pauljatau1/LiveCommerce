import { useState, useMemo, useEffect } from 'react';
import { useOnboardingContext } from '../../Hooks/useOnboardingContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from 'country-state-city';
import Step2 from '../../assets/onboarding-setp1.png';
import CircularProgress from '@mui/material/CircularProgress';


const IndividualOnboarding = () => {
  const navigate = useNavigate();
  const { registerIndividualBasicDetails, isLoading } = useOnboardingContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [visibleCountries, setVisibleCountries] = useState([]);
  const [visibleStates, setVisibleStates] = useState([]);
  const [visibleCities, setVisibleCities] = useState([]);
  const [streetAddress1, setStreetAddress1] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [zipCode, setZipCode] = useState("");

  const CHUNK_SIZE = 50;

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() =>
    countryCode ? State.getStatesOfCountry(countryCode) : []
    , [countryCode]);
  const cities = useMemo(() =>
    stateCode ? City.getCitiesOfState(countryCode, stateCode) : []
    , [countryCode, stateCode]);

  const filteredCountries = useMemo(() =>
    countries.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    , [countries, searchQuery]);

  const filteredStates = useMemo(() =>
    states.filter(state =>
      state.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
    )
    , [states, stateSearchQuery]);

  const filteredCities = useMemo(() =>
    cities.filter(city =>
      city.name.toLowerCase().includes(citySearchQuery.toLowerCase())
    )
    , [cities, citySearchQuery]);

  useEffect(() => {
    setVisibleCountries(countries.slice(0, CHUNK_SIZE));
  }, [countries]);

  useEffect(() => {
    setVisibleStates(states.slice(0, CHUNK_SIZE));
  }, [states]);

  useEffect(() => {
    setVisibleCities(cities.slice(0, CHUNK_SIZE));
  }, [cities]);

  // Load more functions
  const loadMoreCountries = () => {
    setVisibleCountries(prev => [
      ...prev,
      ...countries.slice(prev.length, prev.length + CHUNK_SIZE)
    ]);
  };

  const loadMoreStates = () => {
    setVisibleStates(prev => [
      ...prev,
      ...states.slice(prev.length, prev.length + CHUNK_SIZE)
    ]);
  };

  const loadMoreCities = () => {
    setVisibleCities(prev => [
      ...prev,
      ...cities.slice(prev.length, prev.length + CHUNK_SIZE)
    ]);
  };

  const handleCountrySelect = (isoCode) => {
    const country = countries.find(c => c.isoCode === isoCode);
    setSelectedCountry(country.name);
    setCountryCode(isoCode);
    setSelectedState("");
    setStateCode("");
    setSelectedCity("");
  };

  const handleStateSelect = (isoCode) => {
    const state = states.find(s => s.isoCode === isoCode);
    setSelectedState(state.name);
    setStateCode(isoCode);
    setSelectedCity("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleNext = async(e) => {
    e.preventDefault();
    if (firstName && lastName && selectedCountry && selectedState && selectedCity && streetAddress1 && zipCode) {
      const formattedData = {
        firstName: firstName,
        lastName: lastName,
        sellerAddress: {
          country: selectedCountry,
          state: selectedState,
          city: selectedCity,
          streetAddress1: streetAddress1,
          streetAddress2: streetAddress2,
          zipCode: zipCode
        }
      }

      console.log("Form submitted", formattedData);
      registerIndividualBasicDetails(formattedData);
    } else {
      toast.error('Please fill in all required fields', {
        description: 'All fields except Street Address Line 2 are required',
        style: {
          background: '#05031F',
          color: '#fff',
        }
      });
    }
  };

  return (
    <div className="py-[47.5px] lg:py-[135px] px-[50px] lg:px-[203.5px]">
      <div className="flex flex-col items-center justify-center">
        <img src={Step2} alt="Step 2" className="w-full lg:w-[1000px]" />
        <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px]">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7">Individual Seller Information</h1>
            <p className="text-center text-base lg:text-2xl font-light my-2 lg:my-14">
              We just need a little information about you to process your application to sell on Augli
            </p>

            <form className="w-full mt-5 ">
              <div className="flex flex-col items-center justify-center gap-5 lg:gap-7 w-full mb-7">
                <label className="text-base lg:text-2xl font-normal mb-2">Full Legal Name</label>
                <div className="flex flex-col md:flex-row gap-5 lg:gap-7 w-full mb-7">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full border border-gray-300 rounded-full py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full border border-gray-300 rounded-full py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center my-12 lg:my-20">
                <label className="text-base lg:text-2xl font-normal mb-6 lg:mb-10">Complete Address</label>
                <div className="flex flex-col md:flex-row gap-5 lg:gap-7 w-full mb-7">
                  <div className="flex flex-col w-full">
                    <Select onValueChange={handleCountrySelect}>
                      <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent className="w-full max-h-[300px]">
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="px-2 py-1 w-full border-b"
                        />
                        <SelectGroup>
                          {searchQuery
                            ? filteredCountries.map((country) => (
                              <SelectItem key={country.isoCode} value={country.isoCode}>
                                {country.name}
                              </SelectItem>
                            ))
                            : visibleCountries.map((country) => (
                              <SelectItem key={country.isoCode} value={country.isoCode}>
                                {country.name}
                              </SelectItem>
                            ))
                          }
                          {!searchQuery && visibleCountries.length < countries.length && (
                            <div
                              className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                              onClick={loadMoreCountries}
                            >
                              Load more countries...
                            </div>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col w-full">
                    <Select onValueChange={handleStateSelect} disabled={!countryCode}>
                      <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="w-full max-h-[300px]">
                        <input
                          type="text"
                          placeholder="Search states..."
                          value={stateSearchQuery}
                          onChange={(e) => setStateSearchQuery(e.target.value)}
                          className="px-2 py-1 w-full border-b"
                        />
                        <SelectGroup>
                          {stateSearchQuery
                            ? filteredStates.map((state) => (
                              <SelectItem key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </SelectItem>
                            ))
                            : visibleStates.map((state) => (
                              <SelectItem key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </SelectItem>
                            ))
                          }
                          {!stateSearchQuery && visibleStates.length < states.length && (
                            <div
                              className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                              onClick={loadMoreStates}
                            >
                              Load more states...
                            </div>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col w-full mb-7">
                  <Select onValueChange={setSelectedCity} disabled={!stateCode}>
                    <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent className="w-full max-h-[300px]">
                      <input
                        type="text"
                        placeholder="Search cities..."
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        className="px-2 py-1 w-full border-b"
                      />
                      <SelectGroup>
                        {citySearchQuery
                          ? filteredCities.map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))
                          : visibleCities.map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))
                        }
                        {!citySearchQuery && visibleCities.length < cities.length && (
                          <div
                            className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                            onClick={loadMoreCities}
                          >
                            Load more cities...
                          </div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <textarea
                  placeholder="Street Address"
                  value={streetAddress1}
                  onChange={(e) => setStreetAddress1(e.target.value)}
                  className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[100px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none mb-7"
                />

                <textarea
                  placeholder="Street Address Line 2 (Optional)"
                  value={streetAddress2}
                  onChange={(e) => setStreetAddress2(e.target.value)}
                  className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[100px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none mb-7"
                />

                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Zip Code"
                  className="w-full border border-gray-300 rounded-full py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300"
                />
              </div>

              <div className="flex items-center justify-center gap-10 mt-20 lg:mt-14">
                <button
                  onClick={handleBack}
                  type="button"
                  className="bg-transparent text-[#05031F] border border-[#05031F] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  type="submit"
                  className="bg-[#05031F] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                >
                  {
                    isLoading ? <CircularProgress size={20} color="inherit" /> : 'Next'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualOnboarding;