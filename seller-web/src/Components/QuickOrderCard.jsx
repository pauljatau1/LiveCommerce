import PropTypes from "prop-types"


const QuickOrderCard = ({ product }) => {
  return (
    <div className="w-full cursor-pointer hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center justify-between p-4 gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
            <img
              src={product?.images[0].url || "/placeholder.svg"}
              alt={product?.name}
             
              className="rounded-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product?.name}</p>
            <p className="text-sm text-gray-500">
              {product?.stats?.soldCount} {product?.stats?.soldCount === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">₦{product?.price?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

QuickOrderCard.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
      }),
    ).isRequired,
    stats: PropTypes.shape({
      soldCount: PropTypes.number.isRequired,
    }).isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
}

export default QuickOrderCard

