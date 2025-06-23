

interface ActionButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    color: string;
    label?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick, color, label }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full ${color} text-white py-3 px-4 rounded-lg flex flex-col items-center cursor-pointer justify-center transition-colors font-semibold`}
        >
            <div className="flex items-center space-x-2">
                {children}
            </div>
            {label && (
                <span className="text-xs text-gray-300 text-opacity-70 mt-1 font-normal">
                    {label}
                </span>
            )}
        </button>
    );
};