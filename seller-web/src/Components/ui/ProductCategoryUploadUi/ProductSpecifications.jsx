import { useState, useEffect } from 'react';
import SmartPhoneSpecs from './SmartPhoneSpecs';
import FeaturePhoneSpecs from './FeaturePhoneSpecs';
import RefurbishedPhoneSpecs from './RefurbishedPhoneSpecs';
import ChargerSpecs from './ChargerSpecs';
import EarphoneSpecs from './EarphoneSpecs';
import PowerBankSpecs from './PowerBankSpecs';
import CaseSpecs from './CaseSpecs';
import ProtectorSpecs from './ProtectorSpecs';
import HolderSpecs from './HolderSpecs';
import SmartwatchSpecs from './SmartwatchesSpecs';
import WearableAccessorySpecs from './WearableAccessorySpecs';
import AndroidTabletSpecs from './AndroidTabletsSpecs';
import IPadSpecs from './iPadSpecs';
import KidsTabletSpecs from './KidsTabletSpecs';
import LaptopSpecs from './LaptopSpecs';
import DesktopSpecs from './DesktopSpecs';
import KeyboardSpecs from './KeyboardSpecs';
import MouseSpecs from './MouseSpecs';
import MonitorSpecs from './MonitorSpecs';
import HeadsetSpecs from './HeadsetSpecs';
import ExternalHDDSpecs from './ExternalHDDSpecs';
import USBFlashSpecs from './USBFlashSpecs';
import ExternalSSDSpecs from './ExternalSSDSpecs';
import RouterSpecs from './RouterSpecs';
import RangeExtenderSpecs from './RangeExtenderSpecs';
import PrinterSpecs from './PrinterSpecs';
import ScannerSpecs from './ScannerSpecs';
import GamingLaptopSpecs from './GamingLaptopSpecs';
import GamingDesktopSpecs from './GamingDesktopSpecs';
import GraphicsCardSpecs from './GraphicsCardSpecs';
import ProcessorSpecs from './ProcessorSpecs';
import CoolingSystemSpecs from './CoolingSystemSpecs';
import CookwareSpecs from './CookwareSpecs';
import BakewareSpecs from './BakewareSpecs';
import OvenCookwareSpecs from './OvenCookwareSpecs';
import KitchenUtensilsSpecs from './KitchenUtensilsSpecs';
import KnivesCutlerySpecs from './KnivesCutlerySpecs';
import TablewareSpecs from './TablewareSpecs';
import FoodStorageSpecs from './FoodStorageSpecs';
import WomenFashionSpecs from './WomenFashionSpecs';
import MensWearSpecs from './MensWearSpecs';
import KidsWearSpecs from './KidsWearSpecs';
import BabyApparelSpecs from './BabyApparelSpecs';
import BabyDiaperingSpecs from './BabyDiaperingSpecs';
import BabyFeedingSpecs from './BabyFeedingSpecs';
import BathingSkinCareSpecs from './BathingSkinCareSpecs';
import ToysPlaySpecs from './ToysPlaySpecs';
import MakeupSpecs from './MakeupSpecs';
import SkinCareSpecs from './SkinCareSpecs';
import HairCareSpecs from './HairCareSpecs';
import FragranceSpecs from './FragranceSpecs';
import PersonalCareSpecs from './PersonalCareSpecs';
import VitaminsSupplementsSpecs from './VitaminsSupplementsSpecs';
import BathBodySpecs from './BathBodySpecs';
import SpaRelaxationSpecs from './SpaRelaxationSpecs';
import FootCareSpecs from './FootCareSpecs';
import ConsoleSpecs from './ConsoleSpecs';
import GameSpecs from './GameSpecs';
import GamingAccessorySpecs from './GamingAccessorySpecs';
import VirtualRealitySpecs from './VirtualRealitySpecs';
import GamingFurnitureSpecs from './GamingFurnitureSpecs';
import PropTypes from 'prop-types';

const ProductSpecifications = ({ category, subcategory, onSpecsChange, initialSpecs }) => {
  const [specs, setSpecs] = useState(initialSpecs || {});

  // Update specs when initialSpecs changes
  useEffect(() => {
    if (initialSpecs && Object.keys(initialSpecs).length > 0) {
      setSpecs(initialSpecs);
    }
  }, [initialSpecs]);

  const handleSpecChange = (field, value) => {
    const updatedSpecs = { ...specs, [field]: value };
    setSpecs(updatedSpecs);
    
    let mappedSpecs = {};
    
    switch (subcategory) {
      case 'Smart Phones':
        mappedSpecs = {
          phones_operatingsystem: updatedSpecs.phones_operatingsystem || '',
          phones_screensize: updatedSpecs.phones_screensize || '',
          phones_storagecapacity: updatedSpecs.phones_storagecapacity || '',
          phones_camera: updatedSpecs.phones_camera || '',
          phones_batterylife: updatedSpecs.phones_batterylife || '',
          phones_connectivity: updatedSpecs.phones_connectivity || '',
          phones_simtype: updatedSpecs.phones_simtype || ''
        };
        break;

      case 'Feature Phones':
        mappedSpecs = {
          phones_screensize: updatedSpecs.phones_screensize || '',
          phones_batterylife: updatedSpecs.phones_batterylife || '',
          phones_connectivity: updatedSpecs.phones_connectivity || '',
          phones_simtype: updatedSpecs.phones_simtype || ''
        };
        break;

      case 'Refurbished Phones':
        mappedSpecs = {
          phones_condition: updatedSpecs.phones_condition || '',
          phones_warranty: updatedSpecs.phones_warranty || '',
          phones_batterylife: updatedSpecs.phones_batterylife || ''
        };
        break;

      case 'Chargers':
        mappedSpecs = {
          mobileAccessories_Type: updatedSpecs.mobileAccessories_Type || '',
          mobileAccessories_Output: updatedSpecs.mobileAccessories_Output || '',
          mobileAccessories_Connector: updatedSpecs.mobileAccessories_Connector || ''
        };
        break;

      case 'Earphones & Headsets':
        mappedSpecs = {
          mobileAccessories_Type: updatedSpecs.mobileAccessories_Type || '',
          mobileAccessories_Input: updatedSpecs.mobileAccessories_Input || '',
          mobileAccessories_Features: updatedSpecs.mobileAccessories_Features || ''
        };
        break;

      case 'Power Banks':
        mappedSpecs = {
          mobileAccessories_Capacity: updatedSpecs.mobileAccessories_Capacity || '',
          mobileAccessories_Input: updatedSpecs.mobileAccessories_Input || '',
          mobileAccessories_Output: updatedSpecs.mobileAccessories_Output || ''
        };
        break;

      case 'Phone Cases & Covers':
        mappedSpecs = {
          mobileAccessories_Material: updatedSpecs.mobileAccessories_Material || '',
          mobileAccessories_Features: updatedSpecs.mobileAccessories_Features || ''
        };
        break;

      case 'Screen Protectors':
        mappedSpecs = {
          mobileAccessories_Material: updatedSpecs.mobileAccessories_Material || '',
          mobileAccessories_Features: updatedSpecs.mobileAccessories_Features || ''
        };
        break;

      case 'Holders & Stands':
        mappedSpecs = {
          mobileAccessories_Type: updatedSpecs.mobileAccessories_Type || '',
          mobileAccessories_Adjustable: updatedSpecs.mobileAccessories_Adjustable || false
        };
        break;

      case 'Smartwatches':
        mappedSpecs = {
          wearable_Features: updatedSpecs.wearable_Features || '',
          wearable_Connectivity: updatedSpecs.wearable_Connectivity || ''
        };
        break;

      case 'Wearable Accessories':
        mappedSpecs = {
          wearable_Type: updatedSpecs.wearable_Type || '',
          wearable_Material: updatedSpecs.wearable_Material || ''
        };
        break;

      case 'Android Tablets':
        mappedSpecs = {
          tablets_storageCapacity: updatedSpecs.tablets_storageCapacity || '',
          tablets_Connectivity: updatedSpecs.tablets_Connectivity || '',
          tablets_batteryLife: updatedSpecs.tablets_batteryLife || ''
        };
        break;

      case 'iPads':
        mappedSpecs = {
          tablets_models: updatedSpecs.tablets_models || '',
          tablets_storageCapacity: updatedSpecs.tablets_storageCapacity || '',
          tablets_Connectivity: updatedSpecs.tablets_Connectivity || '',
          tablets_batteryLife: updatedSpecs.tablets_batteryLife || ''
        };
        break;

      case 'Kids Tablets':
        mappedSpecs = {
          tablets_Durability: updatedSpecs.tablets_Durability || '',
          tablets_ParentalControls: updatedSpecs.tablets_ParentalControls || false,
          tablets_PreinstalledApps: updatedSpecs.tablets_PreinstalledApps || false
        };
        break;

      case 'Laptops':
        mappedSpecs = {
          computing_screensize: updatedSpecs.computing_screensize || '',
          computing_processor: updatedSpecs.computing_processor || '',
          computing_ram: updatedSpecs.computing_ram || '',
          computing_storage: updatedSpecs.computing_storage || '',
          computing_operatingsystem: updatedSpecs.computing_operatingsystem || '',
          computing_touchscreen: updatedSpecs.computing_touchscreen || false,
          computing_batterylife: updatedSpecs.computing_batterylife || ''
        };
        break;

      case 'Desktops':
        mappedSpecs = {
          computing_processor: updatedSpecs.computing_processor || '',
          computing_cores: updatedSpecs.computing_cores || '',
          computing_clockspeed: updatedSpecs.computing_clockspeed || '',
          computing_ram: updatedSpecs.computing_ram || '',
          computing_storage: updatedSpecs.computing_storage || '',
          computing_graphics: updatedSpecs.computing_graphics || '',
          computing_vramsize: updatedSpecs.computing_vramsize || '',
          computing_operatingsystem: updatedSpecs.computing_operatingsystem || ''
        };
        break;

      case 'Keyboards':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_connectivity: updatedSpecs.computing_connectivity || [],
          computing_features: updatedSpecs.computing_features || []
        };
        break;

      case 'Mice':
        mappedSpecs = {
          computing_connectivity: updatedSpecs.computing_connectivity || [],
          computing_dpi: updatedSpecs.computing_dpi || '',
          computing_features: updatedSpecs.computing_features || []
        };
        break;

      case 'Monitors':
        mappedSpecs = {
          computing_screensize: updatedSpecs.computing_screensize || '',
          computing_resolution: updatedSpecs.computing_resolution || '',
          computing_panelType: updatedSpecs.computing_panelType || '',
          computing_refreshRate: updatedSpecs.computing_refreshRate || '',
          computing_connectivity: updatedSpecs.computing_connectivity || []
        };
        break;

      case 'Headsets':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_features: updatedSpecs.computing_features || [],
          computing_microphone: updatedSpecs.computing_microphone || false
        };
        break;

      case 'External Hard Drives':
        mappedSpecs = {
          computing_storage: updatedSpecs.computing_storage || '',
          computing_connectivity: updatedSpecs.computing_connectivity || [],
          computing_features: updatedSpecs.computing_features || []
        };
        break;

      case 'USB Flash Drives':
        mappedSpecs = {
          computing_storage: updatedSpecs.computing_storage || '',
          computing_connectivity: updatedSpecs.computing_connectivity || [],
          computing_security: updatedSpecs.computing_security || ''
        };
        break;

      case 'External Solid State Drives':
        mappedSpecs = {
          computing_storage: updatedSpecs.computing_storage || '',
          computing_connectivity: updatedSpecs.computing_connectivity || [],
          computing_features: updatedSpecs.computing_features || []
        };
        break;

      case 'Routers':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_coverage: updatedSpecs.computing_coverage || '',
          computing_speed: updatedSpecs.computing_speed || ''
        };
        break;

      case 'Range Extenders':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_coverage: updatedSpecs.computing_coverage || '',
          computing_speed: updatedSpecs.computing_speed || ''
        };
        break;

      case 'Printers':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_features: updatedSpecs.computing_features || [],
          computing_printspeed: updatedSpecs.computing_printspeed || ''
        };
        break;

      case 'Scanners':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_resolution: updatedSpecs.computing_resolution || '',
          computing_connectivity: updatedSpecs.computing_connectivity || []
        };
        break;

      case 'Gaming Laptops':
        mappedSpecs = {
          computing_processor: updatedSpecs.computing_processor || '',
          computing_graphics: updatedSpecs.computing_graphics || '',
          computing_ram: updatedSpecs.computing_ram || '',
          computing_storage: updatedSpecs.computing_storage || ''
        };
        break;

      case 'Gaming Desktops':
        mappedSpecs = {
          computing_processor: updatedSpecs.computing_processor || '',
          computing_graphics: updatedSpecs.computing_graphics || '',
          computing_ram: updatedSpecs.computing_ram || '',
          computing_storage: updatedSpecs.computing_storage || ''
        };
        break;

      case 'Graphics Cards':
        mappedSpecs = {
          computing_brand: updatedSpecs.computing_brand || '',
          computing_vramsize: updatedSpecs.computing_vramsize || '',
          computing_features: updatedSpecs.computing_features || []
        };
        break;

      case 'Processors':
        mappedSpecs = {
          computing_brand: updatedSpecs.computing_brand || '',
          computing_cores: updatedSpecs.computing_cores || '',
          computing_clockspeed: updatedSpecs.computing_clockspeed || ''
        };
        break;

      case 'Cooling Systems':
        mappedSpecs = {
          computing_type: updatedSpecs.computing_type || '',
          computing_compatibility: updatedSpecs.computing_compatibility || '',
          computing_noiselevel: updatedSpecs.computing_noiselevel || ''
        };
        break;

      case 'Cookware':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_size: updatedSpecs.kitchen_size || '',
          kitchen_inductioncompatible: updatedSpecs.kitchen_inductioncompatible || false,
          kitchen_capacity: updatedSpecs.kitchen_capacity || '',
          kitchen_lidincluded: updatedSpecs.kitchen_lidincluded || false,
          kitchen_handletype: updatedSpecs.kitchen_handletype || '',
          kitchen_ovensafe: updatedSpecs.kitchen_ovensafe || false
        };
        break;

      case 'Bakeware':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_size: updatedSpecs.kitchen_size || '',
          kitchen_heatresistance: updatedSpecs.kitchen_heatresistance || '',
          kitchen_numberofcups: updatedSpecs.kitchen_numberofcups || '',
          kitchen_leakproof: updatedSpecs.kitchen_leakproof || false,
          kitchen_shapetype: updatedSpecs.kitchen_shapetype || '',
          kitchen_capacity: updatedSpecs.kitchen_capacity || ''
        };
        break;

      case 'Oven Cookware':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_size: updatedSpecs.kitchen_size || '',
          kitchen_capacity: updatedSpecs.kitchen_capacity || '',
          kitchen_rackincluded: updatedSpecs.kitchen_rackincluded || false,
          kitchen_ovensafe: updatedSpecs.kitchen_ovensafe || false
        };
        break;

      case 'Kitchen Utensils':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_heatresistance: updatedSpecs.kitchen_heatresistance || '',
          kitchen_dishwashersafe: updatedSpecs.kitchen_dishwashersafe || false,
          kitchen_length: updatedSpecs.kitchen_length || '',
          kitchen_lockingmechanism: updatedSpecs.kitchen_lockingmechanism || false,
          kitchen_shapetype: updatedSpecs.kitchen_shapetype || '',
          kitchen_bladetype: updatedSpecs.kitchen_bladetype || '',
          kitchen_bladematerial: updatedSpecs.kitchen_bladematerial || ''
        };
        break;

      case 'Knives & Cutlery':
        mappedSpecs = {
          kitchen_bladematerial: updatedSpecs.kitchen_bladematerial || '',
          kitchen_handletype: updatedSpecs.kitchen_handletype || '',
          kitchen_numberofcups: updatedSpecs.kitchen_numberofcups || '',
          kitchen_bladetype: updatedSpecs.kitchen_bladetype || '',
          kitchen_bladelength: updatedSpecs.kitchen_bladelength || '',
          kitchen_dishwashersafe: updatedSpecs.kitchen_dishwashersafe || false,
          kitchen_finish: updatedSpecs.kitchen_finish || ''
        };
        break;

      case 'Tableware':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_shapetype: updatedSpecs.kitchen_shapetype || '',
          kitchen_capacity: updatedSpecs.kitchen_capacity || '',
          kitchen_dishwashersafe: updatedSpecs.kitchen_dishwashersafe || false,
          kitchen_features: updatedSpecs.kitchen_features || []
        };
        break;

      case 'Food Storage':
        mappedSpecs = {
          kitchen_material: updatedSpecs.kitchen_material || '',
          kitchen_features: updatedSpecs.kitchen_features || [],
          kitchen_lockingmechanism: updatedSpecs.kitchen_lockingmechanism || '',
          kitchen_dishwashersafe: updatedSpecs.kitchen_dishwashersafe || false
        };
        break;

      case 'Women':
        mappedSpecs = {
          fashion_material: updatedSpecs.fashion_material || '',
          fashion_sizes: updatedSpecs.fashion_sizes || [],
          fashion_style: updatedSpecs.fashion_style || '',
          fashion_sleeveType: updatedSpecs.fashion_sleeveType || '',
          fashion_length: updatedSpecs.fashion_length || '',
          fashion_heelType: updatedSpecs.fashion_heelType || '',
          fashion_closure: updatedSpecs.fashion_closure || '',
          fashion_occasion: updatedSpecs.fashion_occasion || '',
          fashion_accessoryType: updatedSpecs.fashion_accessoryType || '',
          fashion_colors: updatedSpecs.fashion_colors || [],
          fashion_stoneType: updatedSpecs.fashion_stoneType || '',
          fashion_bagType: updatedSpecs.fashion_bagType || ''
        };
        break;

      case 'Mens':
        mappedSpecs = {
          fashion_material: updatedSpecs.fashion_material || '',
          fashion_sizes: updatedSpecs.fashion_sizes || [],
          fashion_style: updatedSpecs.fashion_style || '',
          fashion_fit: updatedSpecs.fashion_fit || '',
          fashion_closure: updatedSpecs.fashion_closure || '',
          fashion_shoeType: updatedSpecs.fashion_shoeType || '',
          fashion_accessoryType: updatedSpecs.fashion_accessoryType || '',
          fashion_traditionalType: updatedSpecs.fashion_traditionalType || ''
        };
        break;

      case "Kid's Wears":
        mappedSpecs = {
          fashion_material: updatedSpecs.fashion_material || '',
          fashion_sizes: updatedSpecs.fashion_sizes || [],
          fashion_pattern: updatedSpecs.fashion_pattern || '',
          fashion_style: updatedSpecs.fashion_style || '',
          fashion_shoeType: updatedSpecs.fashion_shoeType || '',
          fashion_accessoryType: updatedSpecs.fashion_accessoryType || ''
        };
        break;

      case 'Apparel & Accessories':
        mappedSpecs = {
          baby_productType: updatedSpecs.baby_productType || [],
          baby_size: updatedSpecs.baby_size || '',
          baby_material: updatedSpecs.baby_material || [],
          baby_pattern: updatedSpecs.baby_pattern || [],
          baby_fit: updatedSpecs.baby_fit || '',
          baby_features: updatedSpecs.baby_features || [],
          baby_color: updatedSpecs.baby_color || '',
          baby_closure: updatedSpecs.baby_closure || []
        };
        break;

      case 'Diapering':
        mappedSpecs = {
          baby_diaperType: updatedSpecs.baby_diaperType || [],
          baby_absorption: updatedSpecs.baby_absorption || '',
          baby_material: updatedSpecs.baby_material || [],
          baby_closure: updatedSpecs.baby_closure || [],
          baby_bagType: updatedSpecs.baby_bagType || [],
          baby_wipeType: updatedSpecs.baby_wipeType || [],
          baby_features: updatedSpecs.baby_features || []
        };
        break;

      case 'Feeding':
        mappedSpecs = {
          baby_feedingType: updatedSpecs.baby_feedingType || [],
          baby_feedingProductType: updatedSpecs.baby_feedingProductType || [],
          baby_material: updatedSpecs.baby_material || [],
          baby_capacity: updatedSpecs.baby_capacity || '',
          baby_features: updatedSpecs.baby_features || []
        };
        break;

      case 'Bathing & Skin Care':
        mappedSpecs = {
          baby_bathingProductType: updatedSpecs.baby_bathingProductType || [],
          baby_material: updatedSpecs.baby_material || [],
          baby_ingredients: updatedSpecs.baby_ingredients || []
        };
        break;

      case 'Toys & Play':
        mappedSpecs = {
          baby_toyType: updatedSpecs.baby_toyType || [],
          baby_material: updatedSpecs.baby_material || [],
          baby_toyFeatures: updatedSpecs.baby_toyFeatures || []
        };
        break;

      case 'Makeup':
        mappedSpecs = {
          healthBeauty_makeupType: updatedSpecs.healthBeauty_makeupType || [],
          healthBeauty_shade: updatedSpecs.healthBeauty_shade || '',
          healthBeauty_coverage: updatedSpecs.healthBeauty_coverage || [],
          healthBeauty_skinType: updatedSpecs.healthBeauty_skinType || [],
          healthBeauty_finish: updatedSpecs.healthBeauty_finish || [],
          healthBeauty_ingredients: updatedSpecs.healthBeauty_ingredients || [],
          healthBeauty_applicatorType: updatedSpecs.healthBeauty_applicatorType || [],
          healthBeauty_spf: updatedSpecs.healthBeauty_spf || false,
          healthBeauty_crueltyFree: updatedSpecs.healthBeauty_crueltyFree || false,
          healthBeauty_waterproof: updatedSpecs.healthBeauty_waterproof || false,
          healthBeauty_longLasting: updatedSpecs.healthBeauty_longLasting || false,
          healthBeauty_quickDry: updatedSpecs.healthBeauty_quickDry || false
        };
        break;

      case 'Skin Care':
        mappedSpecs = {
          healthBeauty_skinCareType: updatedSpecs.healthBeauty_skinCareType || [],
          healthBeauty_skinType: updatedSpecs.healthBeauty_skinType || [],
          healthBeauty_benefits: updatedSpecs.healthBeauty_benefits || [],
          healthBeauty_ingredients: updatedSpecs.healthBeauty_ingredients || [],
          healthBeauty_usageTime: updatedSpecs.healthBeauty_usageTime || [],
          healthBeauty_spfLevel: updatedSpecs.healthBeauty_spfLevel || '',
          healthBeauty_spfType: updatedSpecs.healthBeauty_spfType || '',
          healthBeauty_spf: updatedSpecs.healthBeauty_spf || false,
          healthBeauty_waterResistant: updatedSpecs.healthBeauty_waterResistant || false,
          healthBeauty_tinted: updatedSpecs.healthBeauty_tinted || false
        };
        break;

      case 'Hair Care':
        mappedSpecs = {
          healthBeauty_hairProductType: updatedSpecs.healthBeauty_hairProductType || [],
          healthBeauty_hairType: updatedSpecs.healthBeauty_hairType || [],
          healthBeauty_benefits: updatedSpecs.healthBeauty_benefits || [],
          healthBeauty_holdLevel: updatedSpecs.healthBeauty_holdLevel || '',
          healthBeauty_material: updatedSpecs.healthBeauty_material || [],
          healthBeauty_heatSettings: updatedSpecs.healthBeauty_heatSettings || '',
          healthBeauty_voltage: updatedSpecs.healthBeauty_voltage || '',
          healthBeauty_scented: updatedSpecs.healthBeauty_scented || false,
          healthBeauty_crueltyFree: updatedSpecs.healthBeauty_crueltyFree || false,
          healthBeauty_heatProtection: updatedSpecs.healthBeauty_heatProtection || false
        };
        break;

      case 'Fragrances':
        mappedSpecs = {
          healthBeauty_fragranceType: updatedSpecs.healthBeauty_fragranceType || [],
          healthBeauty_scentFamily: updatedSpecs.healthBeauty_scentFamily || [],
          healthBeauty_longevity: updatedSpecs.healthBeauty_longevity || '',
          healthBeauty_volume: updatedSpecs.healthBeauty_volume || ''
        };
        break;

      case 'Personal Care':
        mappedSpecs = {
          healthBeauty_personalCareType: updatedSpecs.healthBeauty_personalCareType || [],
          healthBeauty_specialty: updatedSpecs.healthBeauty_specialty || [],
          healthBeauty_size: updatedSpecs.healthBeauty_size || '',
          healthBeauty_absorbencyLevel: updatedSpecs.healthBeauty_absorbencyLevel || '',
          healthBeauty_fluoride: updatedSpecs.healthBeauty_fluoride || false,
          healthBeauty_antiperspirant: updatedSpecs.healthBeauty_antiperspirant || false,
          healthBeauty_scentFree: updatedSpecs.healthBeauty_scentFree || false
        };
        break;

      case 'Vitamins & Supplements':
        mappedSpecs = {
          healthBeauty_supplementType: updatedSpecs.healthBeauty_supplementType || [],
          healthBeauty_supplementForm: updatedSpecs.healthBeauty_supplementForm || [],
          healthBeauty_supplementBenefits: updatedSpecs.healthBeauty_supplementBenefits || [],
          healthBeauty_supplementFlavor: updatedSpecs.healthBeauty_supplementFlavor || '',
          healthBeauty_supplementIngredients: updatedSpecs.healthBeauty_supplementIngredients || []
        };
        break;

      case 'Bath & Body':
        mappedSpecs = {
          healthBeauty_bathType: updatedSpecs.healthBeauty_bathType || [],
          healthBeauty_ingredients: updatedSpecs.healthBeauty_ingredients || [],
          healthBeauty_benefits: updatedSpecs.healthBeauty_benefits || [],
          healthBeauty_scented: updatedSpecs.healthBeauty_scented || false,
          healthBeauty_scentFree: updatedSpecs.healthBeauty_scentFree || false
        };
        break;

      case 'Spa & Relaxation':
        mappedSpecs = {
          healthBeauty_spaType: updatedSpecs.healthBeauty_spaType || [],
          healthBeauty_features: updatedSpecs.healthBeauty_features || [],
          healthBeauty_material: updatedSpecs.healthBeauty_material || '',
          healthBeauty_scentFamily: updatedSpecs.healthBeauty_scentFamily || [],
          healthBeauty_usage: updatedSpecs.healthBeauty_usage || ''
        };
        break;

      case 'Foot Care':
        mappedSpecs = {
          healthBeauty_footCareType: updatedSpecs.healthBeauty_footCareType || [],
          healthBeauty_benefits: updatedSpecs.healthBeauty_benefits || [],
          healthBeauty_ingredients: updatedSpecs.healthBeauty_ingredients || []
        };
        break;

      case 'Consoles':
        mappedSpecs = {
          gaming_consoleModel: updatedSpecs.gaming_consoleModel || '',
          gaming_accessories: updatedSpecs.gaming_accessories || [],
          gaming_storageCapacity: updatedSpecs.gaming_storageCapacity || '',
          gaming_features: updatedSpecs.gaming_features || [],
          gaming_edition: updatedSpecs.gaming_edition || '',
          gaming_bundled: updatedSpecs.gaming_bundled || false
        };
        break;

      case 'Games':
        mappedSpecs = {
          gaming_title: updatedSpecs.gaming_title || '',
          gaming_genre: updatedSpecs.gaming_genre || [],
          gaming_rating: updatedSpecs.gaming_rating || '',
          gaming_region: updatedSpecs.gaming_region || '',
          gaming_compatibility: updatedSpecs.gaming_compatibility || [],
          gaming_features: updatedSpecs.gaming_features || []
        };
        break;

      case 'Accessories':
        mappedSpecs = {
          gaming_accessoryType: updatedSpecs.gaming_accessoryType || [],
          gaming_compatibility: updatedSpecs.gaming_compatibility || [],
          gaming_features: updatedSpecs.gaming_features || [],
          gaming_storageCapacity: updatedSpecs.gaming_storageCapacity || '',
          gaming_resolution: updatedSpecs.gaming_resolution || '',
          gaming_connectionType: updatedSpecs.gaming_connectionType || ''
        };
        break;

      case 'Virtual Reality':
        mappedSpecs = {
          gaming_vrModel: updatedSpecs.gaming_vrModel || '',
          gaming_vrFeatures: updatedSpecs.gaming_vrFeatures || [],
          gaming_vrGenres: updatedSpecs.gaming_vrGenres || [],
          gaming_vrCompatibility: updatedSpecs.gaming_vrCompatibility || []
        };
        break;

      case 'Gaming Furniture':
        mappedSpecs = {
          gaming_furnitureType: updatedSpecs.gaming_furnitureType || [],
          gaming_furnitureFeatures: updatedSpecs.gaming_furnitureFeatures || [],
          gaming_furnitureMaterial: updatedSpecs.gaming_furnitureMaterial || [],
          gaming_weightCapacity: updatedSpecs.gaming_weightCapacity || ''
        };
        break;

      default:
        mappedSpecs = {};
    }

    onSpecsChange(mappedSpecs);
  };

  const renderSpecifications = () => {
    if (category === 'Phones') {
      switch (subcategory) {
        case 'Smart Phones':
          return <SmartPhoneSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Feature Phones':
          return <FeaturePhoneSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Refurbished Phones':
          return <RefurbishedPhoneSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Tablets') {
      switch (subcategory) {
        case 'Android Tablets':
          return <AndroidTabletSpecs specs={specs} onChange={handleSpecChange} />;
        case 'iPads':
          return <IPadSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Kids Tablets':
          return <KidsTabletSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Accessories') {
      switch (subcategory) {
        case 'Chargers':
          return <ChargerSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Earphones & Headsets':
          return <EarphoneSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Power Banks':
          return <PowerBankSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Phone Cases & Covers':
          return <CaseSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Screen Protectors':
          return <ProtectorSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Holders & Stands':
          return <HolderSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Wearable Tech') {
      switch (subcategory) {
        case 'Smartwatches':
          return <SmartwatchSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Wearable Accessories':
          return <WearableAccessorySpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Computing') {
      switch (subcategory) {
        case 'Laptops':
          return <LaptopSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Desktops':
          return <DesktopSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Computer Accessories') {
      switch (subcategory) {
        case 'Keyboards':
          return <KeyboardSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Mice':
          return <MouseSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Monitors':
          return <MonitorSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Headsets':
          return <HeadsetSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Data Storage') {
      switch (subcategory) {
        case 'External Hard Drives':
          return <ExternalHDDSpecs specs={specs} onChange={handleSpecChange} />;
        case 'USB Flash Drives':
          return <USBFlashSpecs specs={specs} onChange={handleSpecChange} />;
        case 'External Solid State Drives':
          return <ExternalSSDSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Networking') {
      switch (subcategory) {
        case 'Routers':
          return <RouterSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Range Extenders':
          return <RangeExtenderSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Printers & Scanners') {
      switch (subcategory) {
        case 'Printers':
          return <PrinterSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Scanners':
          return <ScannerSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'PC Gaming') {
      switch (subcategory) {
        case 'Gaming Laptops':
          return <GamingLaptopSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Gaming Desktops':
          return <GamingDesktopSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Graphics Cards':
          return <GraphicsCardSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'PC Components') {
      switch (subcategory) {
        case 'Processors':
          return <ProcessorSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Graphics Cards':
          return <GraphicsCardSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Cooling Systems':
          return <CoolingSystemSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Kitchen & Dining') {
      switch (subcategory) {
        case 'Cookware':
          return <CookwareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Bakeware':
          return <BakewareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Oven Cookware':
          return <OvenCookwareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Kitchen Utensils':
          return <KitchenUtensilsSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Knives & Cutlery':
          return <KnivesCutlerySpecs specs={specs} onChange={handleSpecChange} />;
        case 'Tableware':
          return <TablewareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Food Storage':
          return <FoodStorageSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Fashion') {
      switch (subcategory) {
        case 'Women Fashion':
          return <WomenFashionSpecs specs={specs} onChange={handleSpecChange} />;

        case "Men's Wears":
          return <MensWearSpecs specs={specs} onChange={handleSpecChange} />;
        case "Kid's Wears":
          return <KidsWearSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Baby & Kids') {
      switch (subcategory) {
        case 'Apparel & Accessories':
          return <BabyApparelSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Diapering':
          return <BabyDiaperingSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Feeding':
          return <BabyFeedingSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Bathing & Skin Care':
          return <BathingSkinCareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Toys & Play':
          return <ToysPlaySpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Health & Beauty') {
      switch (subcategory) {
        case 'Makeup':
          return <MakeupSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Skin Care':
          return <SkinCareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Hair Care':
          return <HairCareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Fragrances':
          return <FragranceSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Personal Care':
          return <PersonalCareSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Vitamins & Supplements':
          return <VitaminsSupplementsSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Bath & Body':
          return <BathBodySpecs specs={specs} onChange={handleSpecChange} />;
        case 'Spa & Relaxation':
          return <SpaRelaxationSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Foot Care':
          return <FootCareSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    if (category === 'Gaming') {
      switch (subcategory) {
        case 'Consoles':
          return <ConsoleSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Games':
          return <GameSpecs specs={specs} onChange={handleSpecChange} />;
        case 'Accessories':
          return <GamingAccessorySpecs specs={specs} onChange={handleSpecChange} />;
        case 'Virtual Reality':
          return <VirtualRealitySpecs specs={specs} onChange={handleSpecChange} />;
        case 'Gaming Furniture':
          return <GamingFurnitureSpecs specs={specs} onChange={handleSpecChange} />;
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {renderSpecifications()}
    </div>
  );
};

ProductSpecifications.propTypes = {
  category: PropTypes.string.isRequired,
  subcategory: PropTypes.string.isRequired,
  onSpecsChange: PropTypes.func.isRequired,
  initialSpecs: PropTypes.object,
};

export default ProductSpecifications;
