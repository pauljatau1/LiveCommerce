import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

const MessageProductCard = ({ product }) => {
  return (
    <Card className="overflow-hidden">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-40 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="font-medium text-sm mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">₦{product.price.toLocaleString()}</p>
        <Button variant="outline" size="sm" className="w-full">
          Share in Chat
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessageProductCard; 