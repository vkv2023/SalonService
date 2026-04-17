package com.salon.service;

import com.razorpay.RazorpayException;
import com.salon.domain.PaymentMethod;
import com.salon.dto.BookingDTO;
import com.salon.dto.UserDTO;
import com.salon.model.PaymentOrder;
import com.salon.payloadReponse.PaymentLinkResponse;
import com.stripe.exception.StripeException;
import org.json.JSONException;

public interface PaymentService {
    PaymentLinkResponse createOrder(UserDTO userDTO,
                                    BookingDTO bookingDTO,
                                    PaymentMethod paymentMethod) throws RazorpayException, StripeException, JSONException;
    PaymentOrder getPaymentOrderByID(Long id) throws Exception;
    PaymentOrder getPaymentOrderByPaymentId(String paymentId);

    com.razorpay.PaymentLink createRazorpayPaymentLink(UserDTO userDTO,
                                                       Long amount,
                                                       Long orderId) throws RazorpayException, JSONException;

    String createStripePaymentLink(UserDTO userDTO,
                                   Long amount,
                                   Long orderId) throws StripeException;

    Boolean proceedPayment(PaymentOrder paymentOrder,
                           String paymentId,
                           String paymentLinkId) throws RazorpayException;

}
