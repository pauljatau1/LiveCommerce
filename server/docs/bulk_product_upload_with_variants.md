# Bulk Product Upload with Variants Guide

This guide explains how to use the bulk product upload feature to create products with variants in Auqli.

## CSV Structure

The CSV file for bulk product upload should have the following structure:

### Required Base Fields
- `product name` - Name of the product (required)
- `product description` - Description of the product
- `product main price` - Base price of the product (required)
- `product inventory` - Base inventory quantity for the product
- `product weight` - Weight of the product in kg
- `product main category` - Main category of the product
- `product subcategory` - Subcategory of the product
- `product condition` - Condition of the product (New, Used, etc.)
- `product main image` - URL of the main product image
- `product image 1` - URL of additional product image 1
- `product image 2` - URL of additional product image 2
- `product image 3` - URL of additional product image 3
- `product image 4` - URL of additional product image 4
- `product image 5` - URL of additional product image 5
- `upload status` - Status of the product (should be 'active' to make the product visible)

### Variant Fields
- `is variant` - Set to 'yes', 'true', or '1' for variant rows
- `variant name` - Name of the variant type (e.g., "Color", "Model")
- `variant value` - Value of the variant (e.g., "Red", "iPhone 14")
- `variant price` - Price for this variant
- `variant stock` - Stock quantity for this variant
- `variant image` - URL of the image for this variant

### Sub-variant Fields
- `subvariant name` - Name of the sub-variant type (e.g., "Size")
- `subvariant value` - Value of the sub-variant (e.g., "Small")
- `subvariant price` - Price for this sub-variant
- `subvariant stock` - Stock quantity for this sub-variant
- `subvariant image` - URL of the image for this sub-variant

### Sub-sub-variant Fields
- `subsubvariant name` - Name of the sub-sub-variant type (e.g., "Material")
- `subsubvariant value` - Value of the sub-sub-variant (e.g., "Cotton")
- `subsubvariant price` - Price for this sub-sub-variant
- `subsubvariant stock` - Stock quantity for this sub-sub-variant
- `subsubvariant image` - URL of the image for this sub-sub-variant

## How to Structure Your CSV

1. **Base Product Row**: The first row for each product should contain all the base product information with empty variant fields.

2. **Variant Rows**: Subsequent rows for the same product should:
   - Have the same `product name` as the base row
   - Set `is variant` to 'yes', 'true', or '1'
   - Fill in the appropriate variant fields
   - Set `product inventory` to 0 (inventory is managed at the variant level)

## Examples

### Simple Product with Color and Size Variants

```
product name,product main price,is variant,variant name,variant value,variant price,variant stock,subvariant name,subvariant value,subvariant price,subvariant stock
T-Shirt,2500,,,,,,,,,
T-Shirt,2500,yes,Color,Red,2500,20,Size,Small,2500,5
T-Shirt,2500,yes,Color,Red,2500,20,Size,Medium,2500,8
T-Shirt,2500,yes,Color,Blue,2500,15,Size,Small,2500,5
T-Shirt,2500,yes,Color,Blue,2500,15,Size,Medium,2500,5
```

### Complex Product with Three Levels of Variants

```
product name,product main price,is variant,variant name,variant value,variant price,variant stock,subvariant name,subvariant value,subvariant price,subvariant stock,subsubvariant name,subsubvariant value,subsubvariant price,subsubvariant stock
Leather Jacket,15000,,,,,,,,,,,,,
Leather Jacket,15000,yes,Color,Black,15000,5,Size,Medium,15000,2,Material,Full Grain Leather,16000,1
Leather Jacket,15000,yes,Color,Black,15000,5,Size,Medium,15000,2,Material,Synthetic Leather,14000,1
```

## Important Notes

1. **Grouping**: Products are grouped by `product name`. All rows with the same name are considered part of the same product.

2. **Stock Management**: 
   - The base product's `product inventory` is added to the total stock
   - Each variant's stock contributes to the total product stock
   - Set `product inventory` to 0 for variant rows to avoid double-counting

3. **Pricing**: 
   - If no variant price is specified, the base product price is used
   - Sub-variants can override their parent variant's price
   - Sub-sub-variants can override their parent sub-variant's price

4. **Images**:
   - Each variant level can have its own images
   - If no variant-specific image is provided, the parent level image is used

5. **Required Fields for Variants**:
   - For variants: `variant name` and `variant value` are required
   - For sub-variants: `subvariant name` and `subvariant value` are required
   - For sub-sub-variants: `subsubvariant name` and `subsubvariant value` are required

## Sample Template

A sample CSV template is available at `docs/product_bulk_upload_template.csv` which demonstrates different product types with various variant structures. 