import { useState } from 'react';
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
import PropTypes from 'prop-types';

const ProductSpecifications = ({ category, subcategory, onSpecsChange }) => {
  const [specs, setSpecs] = useState({});

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

    if (category === 'Computers') {
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
};

export default ProductSpecifications;
