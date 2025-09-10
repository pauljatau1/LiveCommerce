import { memo, useState, useCallback } from 'react';
import { useVariants } from '../../../Contexts/VariantContext';
import PropTypes from 'prop-types';
import AddOptionCard from './AddOptionCard';

const VariantCard = memo(({ variant }) => {
    const { deleteOption } = useVariants();
    const [isEditing, setIsEditing] = useState(false);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        deleteOption(variant.id);
    }, [variant.id, deleteOption]);

    return (
        <div className="p-2 sm:p-4 border rounded-lg bg-white space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base">{variant.name}</h3>
                <div className="flex items-center gap-1 sm:gap-2">
                    {isEditing ? (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1 sm:p-2 hover:bg-gray-50 rounded-lg"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-3 h-3 sm:w-4 sm:h-4"
                            >
                                <path
                                    fill="currentColor"
                                    d="M18.75 6.75a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75v-9a.75.75 0 0 1 .75-.75zm-2.47 2.47a.75.75 0 0 0-1.06-1.06L12 11.379 8.78 8.16a.75.75 0 1 0-1.06 1.06L10.94 12l-3.22 3.22a.75.75 0 1 0 1.06 1.06L12 12.621l3.22 3.219a.75.75 0 1 0 1.06-1.06L13.06 12z"
                                />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 sm:p-2 hover:bg-gray-50 rounded-lg"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-3 h-3 sm:w-4 sm:h-4"
                            >
                                <path
                                    fill="currentColor"
                                    d="m11.4 18.161l7.396-7.396a10.3 10.3 0 0 1-3.326-2.234a10.3 10.3 0 0 1-2.235-3.327L5.839 12.6c-.577.577-.866.866-1.114 1.184a6.6 6.6 0 0 0-.749 1.211c-.173.364-.302.752-.56 1.526l-1.362 4.083a1.06 1.06 0 0 0 1.342 1.342l4.083-1.362c.775-.258 1.162-.387 1.526-.56q.647-.308 1.211-.749c.318-.248.607-.537 1.184-1.114m9.448-9.448a3.932 3.932 0 0 0-5.561-5.561l-.887.887l.038.111a8.75 8.75 0 0 0 2.092 3.32a8.75 8.75 0 0 0 3.431 2.13z"
                                />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={handleDelete}

                        className="p-1 sm:p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                        >
                            <path
                                fill="currentColor"
                                d="M3 6.386c0-.484.345-.877.771-.877h2.665c.529-.016.996-.399 1.176-.965l.03-.1l.115-.391c.07-.24.131-.45.217-.637c.338-.739.964-1.252 1.687-1.383c.184-.033.378-.033.6-.033h3.478c.223 0 .417 0 .6.033c.723.131 1.35.644 1.687 1.383c.086.187.147.396.218.637l.114.391l.03.1c.18.566.74.95 1.27.965h2.57c.427 0 .772.393.772.877s-.345.877-.771.877H3.77c-.425 0-.77-.393-.77-.877"
                            />
                            <path
                                fill="currentColor"
                                fillRule="evenodd"
                                d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.339 1.181-5.245l.267-4.188c.1-1.577.15-2.366-.303-2.865c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.288-.303 2.865l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.043.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.043-.713-.43-.672-.864l.5-5.263c.04-.434.409-.75.82-.707"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="mt-2">
                {isEditing ? (
                    <AddOptionCard
                        onDone={() => setIsEditing(false)}
                        initialName={variant.name}
                        initialValues={variant.values}
                        variantId={variant.id}
                    />
                ) : (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                        {variant.values.map((value, index) => (
                            <span
                                key={index}
                                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
                            >
                                {value}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

VariantCard.displayName = 'VariantCard';

VariantCard.propTypes = {
    variant: PropTypes.object.isRequired
};

export default VariantCard; 