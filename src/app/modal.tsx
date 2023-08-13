import React from "react";
import ReactDOM from "react-dom";

const Modal = ({ onClose, children, title } : any) => {
    const handleCloseClick = (e: any) => {
        e.preventDefault();
        onClose();
    };

    const modalContent = (
        <div className="modal-overlay" onClick={handleCloseClick}>
            <div className="modal-wrapper">
                <div className="bg-gray-200" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <a href="#" onClick={handleCloseClick}>
                            x
                        </a>
                    </div>
                    {title && <h1>{title}</h1>}
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        modalContent,
        document.getElementById("modal-root") as HTMLElement
    );
};

export default Modal
