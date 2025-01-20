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
} from "../../Components/ui/select";
import { Country, State, City } from 'country-state-city';
import Step2 from '../../assets/Step2.png';
import CircularProgress from '@mui/material/CircularProgress';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';


const BusinessInformationOnboarding = () => {
    const navigate = useNavigate();
    const { isLoading, registerBusinessWarehouse } = useOnboardingContext();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState('');
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
    const [selectedCountry2, setSelectedCountry2] = useState("");
    const [selectedState2, setSelectedState2] = useState("");
    const [selectedCity2, setSelectedCity2] = useState("");
    const [countryCode2, setCountryCode2] = useState("");
    const [stateCode2, setStateCode2] = useState("");
    const [searchQuery2, setSearchQuery2] = useState('');
    const [stateSearchQuery2, setStateSearchQuery2] = useState('');
    const [citySearchQuery2, setCitySearchQuery2] = useState('');
    const [visibleCountries2, setVisibleCountries2] = useState([]);
    const [visibleStates2, setVisibleStates2] = useState([]);
    const [visibleCities2, setVisibleCities2] = useState([]);
    const [streetAddress1, setStreetAddress1] = useState("");
    const [streetAddress2, setStreetAddress2] = useState("");
    const [warehouseAddress1, setWarehouseAddress1] = useState("")
    const [warehouseAddress2, setWarehouseAddress2] = useState("")
    const [zipCode, setZipCode] = useState("");
    const [warehouseZipCode, setWarehouseZipCode] = useState("");
    const [fillWarehouse, setFillWarehouse] = useState(false);
    const [warehouseName, setWarehouseName] = useState("");
    const [warehousePhone, setWarehousePhone] = useState("");
    const [shippingMethod, setShippingMethod] = useState("");
    const [returnPolicy, setReturnPolicy] = useState("");


    const CHUNK_SIZE = 50;

    // Memoize data
    const countries = useMemo(() => Country.getAllCountries(), []);
    const states = useMemo(() =>
        countryCode ? State.getStatesOfCountry(countryCode) : []
        , [countryCode]);
    const cities = useMemo(() =>
        stateCode ? City.getCitiesOfState(countryCode, stateCode) : []
        , [countryCode, stateCode]);
    const countries2 = useMemo(() => Country.getAllCountries(), []);
    const states2 = useMemo(() =>
        countryCode ? State.getStatesOfCountry(countryCode) : []
        , [countryCode]);
    const cities2 = useMemo(() =>
        stateCode ? City.getCitiesOfState(countryCode, stateCode) : []
        , [countryCode, stateCode]);

    // Handle country selection
    const handleCountrySelect = (isoCode) => {
        const country = countries.find(c => c.isoCode === isoCode);
        setSelectedCountry(country.name);
        setCountryCode(isoCode);
        setSelectedState("");
        setStateCode("");
        setSelectedCity("");
    };

    // Handle country selection for warehouse
    const handleCountrySelect2 = (isoCode) => {
        const country = countries2.find(c => c.isoCode === isoCode);
        setSelectedCountry2(country.name);
        setCountryCode2(isoCode);
        setSelectedState2("");
        setStateCode2("");
        setSelectedCity2("");
    };

    // Handle state selection
    const handleStateSelect = (isoCode) => {
        const state = states.find(s => s.isoCode === isoCode);
        setSelectedState(state.name);
        setStateCode(isoCode);
        setSelectedCity("");
    };

    // Handle state selection for warehouse
    const handleStateSelect2 = (isoCode) => {
        const state = states2.find(s => s.isoCode === isoCode);
        setSelectedState2(state.name);
        setStateCode2(isoCode);
        setSelectedCity2("");
    };

    // Filter data based on search
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


    // Filter data based on search for warehouse
    const filteredCountries2 = useMemo(() =>
        countries2.filter(country =>
            country.name.toLowerCase().includes(searchQuery2.toLowerCase())
        )
        , [countries2, searchQuery2]);

    const filteredStates2 = useMemo(() =>
        states2.filter(state =>
            state.name.toLowerCase().includes(stateSearchQuery2.toLowerCase())
        )
        , [states2, stateSearchQuery2]);

    const filteredCities2 = useMemo(() =>
        cities2.filter(city =>
            city.name.toLowerCase().includes(citySearchQuery2.toLowerCase())
        )
        , [cities2, citySearchQuery2]);

    // Initialize visible data
    useEffect(() => {
        setVisibleCountries(countries.slice(0, CHUNK_SIZE));
    }, [countries]);

    useEffect(() => {
        setVisibleCountries2(countries2.slice(0, CHUNK_SIZE));
    }, [countries2]);

    useEffect(() => {
        setVisibleStates(states.slice(0, CHUNK_SIZE));
    }, [states]);

    useEffect(() => {
        setVisibleStates2(states2.slice(0, CHUNK_SIZE));
    }, [states2]);

    useEffect(() => {
        setVisibleCities(cities.slice(0, CHUNK_SIZE));
    }, [cities]);

    useEffect(() => {
        setVisibleCities2(cities2.slice(0, CHUNK_SIZE));
    }, [cities2]);

    // Load more functions
    const loadMoreCountries = () => {
        setVisibleCountries(prev => [
            ...prev,
            ...countries.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const loadMoreCountries2 = () => {
        setVisibleCountries2(prev => [
            ...prev,
            ...countries2.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const loadMoreStates = () => {
        setVisibleStates(prev => [
            ...prev,
            ...states.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const loadMoreStates2 = () => {
        setVisibleStates2(prev => [
            ...prev,
            ...states2.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const loadMoreCities = () => {
        setVisibleCities(prev => [
            ...prev,
            ...cities.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const loadMoreCities2 = () => {
        setVisibleCities2(prev => [
            ...prev,
            ...cities2.slice(prev.length, prev.length + CHUNK_SIZE)
        ]);
    };

    const handleBack = () => {
        navigate(-1)
    };



    const businessInformationData = {
        businessEmail: email,
        businessNumber: phone,
        businessAddress: {
            country: selectedCountry,
            state: selectedState,
            city: selectedCity,
            streetAddress1: streetAddress1,
            streetAddress2: streetAddress2,
            zipCode: zipCode
        }
    }

    const warehouseData = {
        shippingOptions: {
            shippingMethod: shippingMethod,
            returnsAndExchangePolicy: returnPolicy
        },
        warehouseDetails: {
            name: warehouseName,
            contactNumber: warehousePhone,
            address: {
                country: selectedCountry2,
                state: selectedState2,
                city: selectedCity2,
                addressLine1: warehouseAddress1,
                addressLine2: warehouseAddress2,
                zipCode: warehouseZipCode
            }
        }
    }

    const handleNext = async (event) => {
        event.preventDefault();
        if (selectedCountry && selectedState && selectedCity && streetAddress1 && zipCode && warehouseName && warehousePhone && selectedCountry2 && selectedState2 && selectedCity2 && warehouseAddress1 && warehouseAddress2 && warehouseZipCode && email && phone) {
            await registerBusinessWarehouse(warehouseData, businessInformationData);
        } else if (!fillWarehouse) {
            toast.error('Please fill in your warehouse details', {
                description: 'All fields are required',
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        } else {
            toast.error('Please fill in your business details', {
                description: 'All fields are required',
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        }
    }





    //console.log("Selected Values:", { selectedCountry, selectedState, selectedCity, fillWarehouse, streetAddress1, streetAddress2, zipCode, warehouseName, warehousePhone, warehouseAddress1, warehouseAddress2, warehouseZipCode, selectedCountry2, selectedState2, selectedCity2, email, phone });

    return (
        <div className="py-[47.5px] lg:py-[135px] px-[50px] lg:px-[203.5px] ">
            <div className="flex flex-col items-center justify-center">
                <img src={Step2} alt="Step 1" className="w-full lg:w-[1000px]" />
                <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px] ">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7 ">Business Information</h1>
                        <p className="text-center text-base lg:text-2xl font-light">Let us know details about your business, with just these few questions</p>
                        <form className="w-full mt-14 lg:mt-2">
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="businessName" className="text-base lg:text-2xl font-normal">Business Email</label>
                                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Enter e-mail address' id="businessName" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="phone" className="text-base lg:text-2xl font-normal">Business Phone Number</label>
                                <PhoneInput
                                    country={'ng'}
                                    value={phone}
                                    onChange={phone => setPhone(phone)}
                                    inputProps={{
                                        id: 'phone',
                                        required: true,
                                        placeholder: 'Phone Number'
                                    }}
                                    containerClass="w-full mt-2 lg:mt-4 block"
                                    inputClass="!w-full !min-w-full !h-[65px] lg:!h-[82px] !border !border-gray-300 !rounded-full !py-5 !lg:py-6 !px-4 !lg:px-8 !text-md !lg:text-lg !pl-12 hover:!border-[#05031F] !transition-all !duration-300"
                                    buttonClass="!h-[64px] lg:!h-[81px] !border-0 !rounded-l-full "
                                    dropdownClass="!rounded-lg !border !border-gray-200 !shadow-lg"
                                    enableSearch={true}
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="businessName" className="text-base lg:text-2xl font-normal mb-6 lg:mb-10">Business Address</label>
                                <div className="flex flex-col md:flex-row gap-5 lg:gap-7 w-full mb-7 ">
                                    <div className="flex flex-col w-full">
                                        <Select onValueChange={handleCountrySelect}>
                                            <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                                                <SelectValue placeholder="Select a country" />
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
                                                <SelectValue placeholder="Select a state" />
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
                                <div className="flex flex-col w-full">
                                    <Select onValueChange={setSelectedCity} disabled={!stateCode}>
                                        <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                                            <SelectValue placeholder="Select a city" />
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
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <textarea
                                    placeholder='Street Address'
                                    id="businessName"
                                    value={streetAddress1}
                                    onChange={(e) => setStreetAddress1(e.target.value)}
                                    className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[300px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none"
                                    rows={4}
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <textarea
                                    placeholder='Street Address Line 2 (Optional)'
                                    value={streetAddress2}
                                    onChange={(e) => setStreetAddress2(e.target.value)}
                                    id="businessName"
                                    className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[300px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none"
                                    rows={4}
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder='Zip Code' id="businessName" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                            </div>
                            <div className="space-x-4">
                                <input type="checkbox" onChange={() => setFillWarehouse(!fillWarehouse)} value={fillWarehouse} id="fillBusiness" className="cursor-pointer" />
                                <label htmlFor='fillBusiness' >Fill Warehouse Details</label>
                            </div>
                            {
                                fillWarehouse && (
                                    <div className="mt-5 lg:mt-20">
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <label htmlFor="businessName" className="text-base lg:text-2xl font-normal">Warehouse Name</label>
                                            <input type="text" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} placeholder='Enter warehouse name' id="businessName" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <label htmlFor="businessName" className="text-base lg:text-2xl font-normal">Shipping Method</label>
                                            <input type="text" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} placeholder='Enter shipping method' id="shippingMethod" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <label htmlFor="businessName" className="text-base lg:text-2xl font-normal">Return Policy</label>
                                            <input type="text" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder='Enter your return and exchange policy' id="returnPolicy" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <label htmlFor="phone" className="text-base lg:text-2xl font-normal">Warehouse Contact No</label>
                                            <PhoneInput
                                                country={'ng'}
                                                value={warehousePhone}
                                                onChange={warehousePhone => setWarehousePhone(warehousePhone)}
                                                inputProps={{
                                                    id: 'phone',
                                                    required: true,
                                                    placeholder: 'Phone Number'
                                                }}
                                                containerClass="w-full mt-2 lg:mt-4 block"
                                                inputClass="!w-full !min-w-full !h-[65px] lg:!h-[82px] !border !border-gray-300 !rounded-full !py-5 !lg:py-6 !px-4 !lg:px-8 !text-md !lg:text-lg !pl-12 hover:!border-[#05031F] !transition-all !duration-300"
                                                buttonClass="!h-[64px] lg:!h-[81px] !border-0 !rounded-l-full "
                                                dropdownClass="!rounded-lg !border !border-gray-200 !shadow-lg"
                                                enableSearch={true}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <label htmlFor="businessName" className="text-base lg:text-2xl font-normal mb-6 lg:mb-10">Warehouse Address</label>
                                            <div className="flex flex-col md:flex-row gap-5 lg:gap-7 w-full mb-7 ">
                                                <div className="flex flex-col w-full">
                                                    <Select onValueChange={handleCountrySelect2}>
                                                        <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                                                            <SelectValue placeholder="Select a country" />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-full max-h-[300px]">
                                                            <input
                                                                type="text"
                                                                placeholder="Search countries..."
                                                                value={searchQuery2}
                                                                onChange={(e) => setSearchQuery2(e.target.value)}
                                                                className="px-2 py-1 w-full border-b"
                                                            />
                                                            <SelectGroup>
                                                                {searchQuery2
                                                                    ? filteredCountries2.map((country) => (
                                                                        <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                            {country.name}
                                                                        </SelectItem>
                                                                    ))
                                                                    : visibleCountries2.map((country) => (
                                                                        <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                            {country.name}
                                                                        </SelectItem>
                                                                    ))
                                                                }
                                                                {!searchQuery2 && visibleCountries2.length < countries2.length && (
                                                                    <div
                                                                        className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                                                                        onClick={loadMoreCountries2}
                                                                    >
                                                                        Load more countries...
                                                                    </div>
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <Select onValueChange={handleStateSelect2} disabled={!countryCode2}>
                                                        <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                                                            <SelectValue placeholder="Select a state" />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-full max-h-[300px]">
                                                            <input
                                                                type="text"
                                                                placeholder="Search states..."
                                                                value={stateSearchQuery2}
                                                                onChange={(e) => setStateSearchQuery2(e.target.value)}
                                                                className="px-2 py-1 w-full border-b"
                                                            />
                                                            <SelectGroup>
                                                                {stateSearchQuery
                                                                    ? filteredStates2.map((state) => (
                                                                        <SelectItem key={state.isoCode} value={state.isoCode}>
                                                                            {state.name}
                                                                        </SelectItem>
                                                                    ))
                                                                    : visibleStates2.map((state) => (
                                                                        <SelectItem key={state.isoCode} value={state.isoCode}>
                                                                            {state.name}
                                                                        </SelectItem>
                                                                    ))
                                                                }
                                                                {!stateSearchQuery2 && visibleStates2.length < states2.length && (
                                                                    <div
                                                                        className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                                                                        onClick={loadMoreStates2}
                                                                    >
                                                                        Load more states...
                                                                    </div>
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <Select onValueChange={setSelectedCity2} disabled={!stateCode2}>
                                                    <SelectTrigger className="w-full border border-gray-300 rounded-full py-9 lg:py-11 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300">
                                                        <SelectValue placeholder="Select a city" />
                                                    </SelectTrigger>
                                                    <SelectContent className="w-full max-h-[300px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Search cities..."
                                                            value={citySearchQuery2}
                                                            onChange={(e) => setCitySearchQuery2(e.target.value)}
                                                            className="px-2 py-1 w-full border-b"
                                                        />
                                                        <SelectGroup>
                                                            {citySearchQuery2
                                                                ? filteredCities2.map((city) => (
                                                                    <SelectItem key={city.name} value={city.name}>
                                                                        {city.name}
                                                                    </SelectItem>
                                                                ))
                                                                : visibleCities2.map((city) => (
                                                                    <SelectItem key={city.name} value={city.name}>
                                                                        {city.name}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                            {!citySearchQuery2 && visibleCities2.length < cities2.length && (
                                                                <div
                                                                    className="px-2 py-2 text-center text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                                                                    onClick={loadMoreCities2}
                                                                >
                                                                    Load more cities...
                                                                </div>
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <textarea
                                                placeholder='Street Address'
                                                id="businessName"
                                                value={warehouseAddress1}
                                                onChange={(e) => setWarehouseAddress1(e.target.value)}
                                                className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[300px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <textarea
                                                placeholder='Street Address Line 2 (Optional)'
                                                value={warehouseAddress2}
                                                onChange={(e) => setWarehouseAddress2(e.target.value)}
                                                id="businessName"
                                                className="w-full border border-gray-300 rounded-[25.78px] lg:rounded-[52.78px] mt-2 lg:mt-4 py-5 lg:py-6 h-[300px] px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 resize-none"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                            <input type="text" value={warehouseZipCode} onChange={(e) => setWarehouseZipCode(e.target.value)} placeholder='Zip Code' id="businessName" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-300 " />
                                        </div>
                                    </div>
                                )
                            }
                            <div className="flex items-center justify-center gap-10 mt-20 lg:mt-14 ">
                                <button onClick={handleBack} className="bg-transparent text-[#0BB248] border border-[#0BB248] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer ">Back</button>
                                <button onClick={handleNext} className="bg-[#0BB248] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer ">
                                    {
                                        isLoading ? <CircularProgress size={20} color='white' /> : 'Next'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>
                {`
                    .react-phone-input-2 .selected-flag {
                        background: transparent !important;
                    }
                `}
            </style>
        </div>
    )
}

export default BusinessInformationOnboarding
