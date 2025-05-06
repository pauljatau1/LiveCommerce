import { useState, useEffect } from "react"
import { Plus, MapPin, Building2, Home, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Badge } from "@/Components/ui/badge"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"
import React from "react"

// Replace the COUNTRIES constant with:
const COUNTRIES = ["Nigeria"];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

// Cities object mapping states to their major cities
const NIGERIAN_CITIES = {
  Abia: ["Aba", "Aba North", "Aba South", "Arochukwu", "Bende", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia", "Umuahia North", "Umuahia South"],
  Adamawa: ["Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  AkwaIbom: ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  Anambra: ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  Bauchi: ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Torro", "Warji", "Zaki"],
  Bayelsa: ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  Benue: ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  Borno: ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  CrossRiver: ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  Delta: ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  Ebonyi: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  Edo: ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  Ekiti: ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  Enugu: ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  FCT: ["Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
  Gombe: ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  Imo: ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West"],
  Jigawa: ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasamma", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  Kaduna: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  Kano: ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  Katsina: ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dan Musa", "Dandume", "Danja", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  Kebbi: ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  Kogi: ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  Kwara: ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  Lagos: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  Nasarawa: ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  Niger: ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Muya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  Ogun: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Sagamu"],
  Ondo: ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  Osun: ["Aiyedaade", "Aiyedire", "Atakunmosa East", "Atakunmosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  Oyo: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  Plateau: ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  Rivers: ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emohua", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  Sokoto: ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  Taraba: ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  Yobe: ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  Zamfara: ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Chafe", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"]
};


export default function AddressSettings() {
  console.log("Main component render");
  
  const [profileData, setProfileData] = useState({
    businessAddress: {},
    warehouseDetails: {},
    sellerAddress: {},
    accountType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    country: "",
    state: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    zipCode: "",
  });

  // Add new state for cities
  const [availableCities, setAvailableCities] = useState([]);

  // Define handlers first
  const handleInputChange = React.useCallback((e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Modify handleSelectChange to handle state selection
  const handleSelectChange = React.useCallback((name, value) => {
    setAddressForm(prev => {
      const newForm = {
        ...prev,
        [name]: value
      };
      
      // Reset city when state changes
      if (name === 'state') {
        newForm.city = '';
        // Update available cities based on selected state
        setAvailableCities(NIGERIAN_CITIES[value] || []);
      }
      
      return newForm;
    });
  }, []);

  const handleSubmitAddress = React.useCallback(async () => {
    await handleAddressUpdate(editingAddress, addressForm);
    setEditingAddress(null);
  }, [editingAddress, addressForm]);

  // Then use them in the dialog memo
  const AddressDialog = React.useMemo(() => {
    console.log("Creating dialog component");
    return () => (
      <Dialog 
        open={!!editingAddress} 
        onOpenChange={(open) => {
          if (!open) setEditingAddress(null);
        }}
      >
        <DialogContent 
          className="w-[95vw] max-w-[425px] p-4 sm:p-6"
          aria-describedby="address-form-description"
        >
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? `${editingAddress.charAt(0).toUpperCase() + editingAddress.slice(1)} Address` : 'Address'}
            </DialogTitle>
            <p id="address-form-description" className="text-sm text-muted-foreground">
              Enter the address details below
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={addressForm.country}
                onValueChange={(value) => handleSelectChange("country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Select
                  value={addressForm.city}
                  onValueChange={(value) => handleSelectChange("city", value)}
                  disabled={!addressForm.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={addressForm.addressLine1}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={addressForm.addressLine2}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={addressForm.zipCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditingAddress(null)}>
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSubmitAddress} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [editingAddress, addressForm, isLoading, handleInputChange, handleSelectChange, handleSubmitAddress, availableCities]);

  // Population effect
  useEffect(() => {
    if (editingAddress) {
      let currentAddress = {};
      if (editingAddress === 'business') currentAddress = profileData.businessAddress || {};
      else if (editingAddress === 'warehouse') currentAddress = profileData.warehouseDetails?.address || {};
      else if (editingAddress === 'individual') currentAddress = profileData.sellerAddress || {};

      setAddressForm({
        country: currentAddress.country || "",
        state: currentAddress.state || "",
        city: currentAddress.city || "",
        addressLine1: currentAddress.addressLine1 || "",
        addressLine2: currentAddress.addressLine2 || "",
        zipCode: currentAddress.zipCode || "",
      });
    }
  }, [editingAddress, profileData]);

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      toast.error("Failed to fetch address data");
    }
  };

  const handleAddressUpdate = async (type, addressData) => {
    setIsLoading(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const endpoint = type === 'business' 
        ? '/business-address'
        : type === 'warehouse' 
          ? '/warehouse-details'
          : '/individual-information';

      // Prepare the request body based on the address type
      const requestBody = type === 'business' 
        ? { businessAddress: addressData }
        : type === 'warehouse'
          ? { warehouseDetails: { 
              ...profileData.warehouseDetails,
              address: addressData 
            }}
          : { 
              firstName: profileData.firstName,  // Keep existing firstName
              lastName: profileData.lastName,    // Keep existing lastName
              sellerAddress: addressData        // Update only the address
            };

      const response = await fetch(`${BASE_URL}/seller${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} address updated successfully`);
        await fetchProfileData(); // Refresh data
      } else {
        throw new Error('Failed to update address');
      }
    } catch (error) {
      toast.error(`Failed to update ${type} address`);
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (type) => {
    if (!confirm(`Are you sure you want to delete this ${type} address?`)) return;
    
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const endpoint = type === 'business' 
        ? '/business-address'
        : type === 'warehouse' 
          ? '/warehouse-details'
          : '/individual-information';

      const response = await fetch(`${BASE_URL}/seller${endpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} address deleted successfully`);
        await fetchProfileData(); // Refresh data
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (error) {
      toast.error(`Failed to delete ${type} address`);
    }
  };

  const formatAddress = (address) => {
    if (!address) return [];
    const lines = [];
    if (address.addressLine1) lines.push(address.addressLine1);
    if (address.addressLine2) lines.push(address.addressLine2);
    if (address.city && address.state) lines.push(`${address.city}, ${address.state}`);
    if (address.country) lines.push(address.country);
    if (address.zipCode) lines.push(`ZIP: ${address.zipCode}`);
    return lines;
  };

  const AddressCard = ({ type, icon: Icon, address, hasVerified, name, contact }) => (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{type} Address</CardTitle>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          {hasVerified && (
            <Badge variant="outline" className="text-green-500">Verified</Badge>
          )}
          <div className="text-sm text-blue-700">
            <span>Contact <a href="mailto:support@auqli.com" className="underline font-medium">support@auqli.com</a> to update</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {address ? (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-2">
                <div className="space-y-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{name}</span>
                    <Badge variant="outline" className="text-green-500">Primary</Badge>
                  </div>
                  {formatAddress(address).map((line, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                  {contact && Object.entries(contact).map(([key, value]) => (
                    value && <p key={key} className="text-sm text-muted-foreground">{value}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">No address information available. Please contact support to add an address.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
        <p className="text-sm text-blue-700">
          To update or add address information, please contact support at <a href="mailto:support@auqli.com" className="underline font-medium">support@auqli.com</a>
        </p>
      </div>
      
      {profileData.accountType === 'business' && (
        <AddressCard 
          type="Business"
          icon={Building2}
          address={profileData.businessAddress}
          hasVerified={profileData.hasFilledBusinessAddress}
          name={profileData.businessName || 'Business Address'}
          contact={{
            phone: profileData.businessNumber,
            email: profileData.businessEmail
          }}
        />
      )}

      <AddressCard 
        type="Warehouse"
        icon={MapPin}
        address={profileData?.warehouseDetails?.address}
        hasVerified={profileData.hasFilledWarehouseAddress}
        name={profileData?.warehouseDetails?.name || 'Warehouse Address'}
        contact={{
          phone: profileData?.warehouseDetails?.contactNumber
        }}
      />

      <AddressCard 
        type="Individual"
        icon={Home}
        address={profileData.sellerAddress}
        hasVerified={profileData.hasFilledAddress}
        name="Personal Address"
      />

      {/* Additional Info Card */}
      {/* <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="space-y-1">
              <h3 className="font-medium">Address Verification Status</h3>
              <p className="text-sm text-muted-foreground">
                Your address verification status affects your store's credibility
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge 
                variant="outline" 
                className={profileData.hasFilledAddress ? "text-green-500" : "text-yellow-500"}
              >
                {profileData.hasFilledAddress ? "Verified" : "Pending Verification"}
              </Badge>
              <Button variant="link" className="text-sm text-green-500 h-auto p-0">
                Learn more
              </Button>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
} 