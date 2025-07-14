# Order V2 Module Workflow (Simplified)

This document outlines the simplified workflow for creating and processing orders. The process has been consolidated into three main steps for the frontend.

## Step 1: Create Draft Order, Shipment, and Get Rates

This single, consolidated step handles the entire setup of an order. The frontend sends the order details, and the backend performs three actions in sequence:

1. Creates a `draft` order
2. Creates a corresponding shipment record
3. Fetches the available shipping rates for that shipment

This approach significantly reduces the number of API calls the client needs to make.

### Request

- **Endpoint:** `POST /api/v2/orders`
- **Method:** `POST`
- **Authentication:** Required (Bearer Token)
- **Request Body:**

```json
{
  "items": [
    {
      "productId": "685fb844425af287f59542a2",
      "quantity": 1,
      "price": 15000,
      "weight": 1.2,
      "specifications": {
        "color": "",
        "size": ""
      }
    },
    {
      "productId": "685fb843425af287f5954284",
      "quantity": 1,
      "price": 2500,
      "weight": 0.3,
      "specifications": {
        "color": "",
        "size": ""
      }
    }
  ],
  "shippingAddress": {
    "first_name": "BOLUWATIFE",
    "last_name": "AJAYI",
    "phone": "09124634152",
    "email": "bolu4good@gmail.com",
    "line1": "Block 16 Plot 22 Segun Ajayi Close Amuwo Odofin GRA Lagos",
    "state": "Lagos",
    "city": "Amuwo Odofin",
    "zip": "102102",
    "country": "NG"
  },
  "isStorePickup": false
}
```

### Response

**Status:** 201 Created

```json
{
  "message": "Draft orders created and rates fetched successfully.",
  "orders": [
    {
      "orderId": "60d5f1b3e6b3f3b4a9f3d3a1",
      "order_id": "AUQLI-XYZ123",
      "seller": "60d5f1b3e6b3f3b4a9f3d3a2",
      "totalAmount": 5500,
      "status": "draft",
      "rates": [
        {
          "rate_id": "rate_12345",
          "carrier": "GIG Logistics",
          "amount": 1500,
          "currency": "NGN"
        },
        {
          "rate_id": "rate_67890",
          "carrier": "Kwik Delivery",
          "amount": 2000,
          "currency": "NGN"
        }
      ]
    }
  ]
}
```

## Step 2: Select Carrier and Pay for the Order

This is the final step where the user selects their preferred shipping carrier and makes the payment. This single API call handles both actions.

### Request

- **Endpoint:** `POST /api/v2/orders/{orderId}/pay`
- **Method:** `POST`
- **Authentication:** Required (Bearer Token)

#### URL Parameters

- `orderId`: The ID of the order to be paid for

#### Request Body

```json
{
  "carrier": {
    "rate_id": "rate_12345",
    "name": "GIG Logistics",
    "amount": 1500
  },
  "paymentDetails": {
    "method": "paystack",
    "reference": "txn_ref_abc123"
  }
}
```

### Response

**Status:** 200 OK

```json
{
  "message": "Payment successful and order is now being processed.",
  "order_id": "AUQLI-XYZ123",
  "status": "processing",
  "paid": true
}
```

At this point, the order is considered active, product stock is updated, and notifications will be sent.

## Special Scenarios

### Scenario 1: Store Pickup

For orders where the buyer chooses to pick up the items from the seller's location, no shipment is created and no rates are returned.

#### Request

Set `isStorePickup` to `true` in the request body.

```json
{
  "items": [
    {
      "productId": "685fb844425af287f59542a2",
      "quantity": 1
    }
  ],
  "shippingAddress": { ... },
  "isStorePickup": true
}
```

#### Response

The `orders` array is returned with an empty `rates` array, as no shipment is created.

```json
{
    "message": "Draft orders created and rates fetched successfully.",
    "orders": [
        {
            "orderId": "60d5f1b3e6b3f3b4a9f3d3a3",
            "order_id": "AUQLI-ABC456",
            "status": "draft",
            "isStorePickup": true,
            "rates": []
        }
    ]
}
```

The next step for a store pickup order would be to call the `/pay` endpoint without any `carrier` information.

### Scenario 2: International Shipping

For orders with a delivery address outside of the primary operating country (e.g., not in Nigeria), the system identifies it as an international order. Similar to store pickup, no shipment is created via Terminal Africa, and no rates are returned.

#### Request

Provide a `shippingAddress` with a `country` code other than `NG`.

```json
{
  "items": [
    {
      "productId": "685fb844425af287f59542a2",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "email": "john.doe@example.com",
    "line1": "123 Main Street",
    "state": "California",
    "city": "Los Angeles",
    "zip": "90001",
    "country": "US"
  },
  "isStorePickup": false
}
```

#### Response

The `orders` array is returned with `isInternational: true` and an empty `rates` array.

```json
{
    "message": "Draft orders created and rates fetched successfully.",
    "orders": [
        {
            "orderId": "60d5f1b3e6b3f3b4a9f3d3a4",
            "order_id": "AUQLI-DEF789",
            "status": "draft",
            "isInternational": true,
            "rates": []
        }
    ]
}
```

The seller would then handle the international shipping arrangements manually after payment is complete.