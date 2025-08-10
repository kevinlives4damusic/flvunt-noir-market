import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { validateCardNumber, validateExpiryDate, validateCVV, getCardType } from '@/lib/paymentService';
import { Alert } from '@/components/ui/alert';

interface CardValidation {
  isValid: boolean;
  error?: string;
}

interface CreditCardInputProps {
  onChange: (values: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
    isValid: boolean;
  }) => void;
}

export const CreditCardInput: React.FC<CreditCardInputProps> = ({ onChange }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  const [validations, setValidations] = useState<{
    cardNumber: CardValidation;
    expiryDate: CardValidation;
    cvv: CardValidation;
    nameOnCard: CardValidation;
  }>({
    cardNumber: { isValid: true },
    expiryDate: { isValid: true },
    cvv: { isValid: true },
    nameOnCard: { isValid: true }
  });

  const [cardType, setCardType] = useState('unknown');

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  // Validate all fields and update state
  useEffect(() => {
    const newValidations = {
      cardNumber: { isValid: validateCardNumber(cardNumber) },
      expiryDate: validateExpiryDate(expiryDate),
      cvv: validateCVV(cvv, cardType),
      nameOnCard: { isValid: nameOnCard.length >= 3 }
    };

    setValidations(newValidations);
    setCardType(getCardType(cardNumber));

    const isValid = Object.values(newValidations).every(v => v.isValid);
    onChange({ cardNumber, expiryDate, cvv, nameOnCard, isValid });
  }, [cardNumber, expiryDate, cvv, nameOnCard, cardType]);

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa': return '💳'; // Replace with actual card icons
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getCardIcon()}
          </div>
          <input
            type="text"
            id="cardNumber"
            className={`pl-10 w-full p-2 border rounded ${
              validations.cardNumber.isValid ? 'border-gray-300' : 'border-red-500'
            }`}
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
          />
        </div>
        {!validations.cardNumber.isValid && (
          <p className="mt-1 text-sm text-red-600">Please enter a valid card number</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            className={`w-full p-2 border rounded ${
              validations.expiryDate.isValid ? 'border-gray-300' : 'border-red-500'
            }`}
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            maxLength={5}
          />
          {!validations.expiryDate.isValid && (
            <p className="mt-1 text-sm text-red-600">{validations.expiryDate.error}</p>
          )}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            className={`w-full p-2 border rounded ${
              validations.cvv.isValid ? 'border-gray-300' : 'border-red-500'
            }`}
            placeholder={cardType === 'amex' ? '4 digits' : '3 digits'}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
            maxLength={cardType === 'amex' ? 4 : 3}
          />
          {!validations.cvv.isValid && (
            <p className="mt-1 text-sm text-red-600">{validations.cvv.error}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-1">
          Name on Card
        </label>
        <input
          type="text"
          id="nameOnCard"
          className={`w-full p-2 border rounded ${
            validations.nameOnCard.isValid ? 'border-gray-300' : 'border-red-500'
          }`}
          placeholder="John Doe"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
        />
        {!validations.nameOnCard.isValid && (
          <p className="mt-1 text-sm text-red-600">Please enter the name as shown on your card</p>
        )}
      </div>

      {cardType !== 'unknown' && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            {getCardIcon()}
            <span className="text-sm text-blue-800 capitalize">
              {cardType} card detected
            </span>
          </div>
        </Alert>
      )}
    </div>
  );
};