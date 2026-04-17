package com.salon.service.impl;

import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.salon.domain.PaymentMethod;
import com.salon.domain.PaymentOrderStatus;
import com.salon.dto.BookingDTO;
import com.salon.dto.UserDTO;
import com.salon.model.PaymentOrder;
import com.salon.payloadReponse.PaymentLinkResponse;
import com.salon.repository.PaymentRepository;
import com.salon.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


@Service
@NoArgsConstructor(force = true)
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    @Value("${stripe.api.key}")
    private String stripeAPIKey;

    @Value("${stripe.api.secret}")
    private String stripeAPISecretKey;

    @Value("${razorpay.api.key}")
    private String razorpayAPIKey;

    @Value("${razorpay.api.secret}")
    private String razorAPISecretKey;

    @Autowired
    private final PaymentRepository paymentRepository;

    @Override
    public PaymentLinkResponse createOrder(UserDTO userDTO,
                                           BookingDTO bookingDTO,
                                           PaymentMethod paymentMethod) throws RazorpayException, StripeException, JSONException {
        Long amount = (long) bookingDTO.getTotalPrice();
        PaymentOrder paymentOrder = PaymentOrder.builder()
                .paymentMethod(paymentMethod)
                .amount(amount)
                .salonId(bookingDTO.getSalonId())
                .bookingId(bookingDTO.getId())
                .build();

        paymentRepository.save(paymentOrder);

        PaymentLinkResponse paymentLinkResponse = new PaymentLinkResponse();

        if(paymentMethod.equals(PaymentMethod.RAZORPAY)){
            com.razorpay.PaymentLink payment = createRazorpayPaymentLink(
                    userDTO,
                    paymentOrder.getAmount(),
                    paymentOrder.getId()
            );
            String paymentUrl = payment.get("short_url");
            String paymentUrlId = payment.get("id");

            paymentLinkResponse.setPayment_link_url(paymentUrl);
            paymentLinkResponse.setGet_payment_link_Id(paymentUrlId);

            paymentOrder.setPaymentLinkId(paymentUrlId);
            paymentRepository.save(paymentOrder);
        }else {

            String payment = String.valueOf(createStripePaymentLink(
                    userDTO,paymentOrder.getAmount(),paymentOrder.getId()));
            paymentLinkResponse.setPayment_link_url(payment);

            paymentRepository.save(paymentOrder);
        }
        return paymentLinkResponse;
    }

    @Override
    public PaymentOrder getPaymentOrderByID(Long id) throws Exception {

        PaymentOrder paymentOrder = paymentRepository.findById(id).orElse(null);
        if(paymentOrder==null){
            throw new Exception("Payment order not found...");
        }
        return paymentOrder;
    }

    @Override
    public PaymentOrder getPaymentOrderByPaymentId(String paymentId) {
        return paymentRepository.findByPaymentLinkId(paymentId);
    }

    @Override
    public com.razorpay.PaymentLink createRazorpayPaymentLink(UserDTO userDTO, Long amount, Long orderId) throws RazorpayException, JSONException {
        Long amount1 = amount*1000;
        RazorpayClient razorpayClient = new RazorpayClient(razorpayAPIKey, razorAPISecretKey);
        JSONObject paymentLinkRequest = new JSONObject();
        paymentLinkRequest.put("amount", amount);
        paymentLinkRequest.put("currency", "INR");

        JSONObject customer = new JSONObject();
        customer.put("name",userDTO.getFName()+ userDTO.getLName());
        customer.put("email",userDTO.getEmail());
        paymentLinkRequest.put("customer",customer);

        JSONObject notify = new JSONObject();
        notify.put("email",true);

        paymentLinkRequest.put("notify",notify);

        paymentLinkRequest.put("callback_url","http://localhost:5006/payment-successful");
        paymentLinkRequest.put("callback_method","get");
        return razorpayClient.paymentLink.create(paymentLinkRequest);

    }

    @Override
    public String createStripePaymentLink(UserDTO userDTO, Long amount, Long orderId) throws StripeException {

        Stripe.apiKey = stripeAPIKey;

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:3000/payment-success?orderId=" + orderId)
                .setCancelUrl("http://localhost:3000/payment/cancel")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(amount * 100)  // Stripe uses cents
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData
                                                                .builder()
                                                                .setName("Salon appointment booking")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        Session session = Session.create(params);

        return session.getUrl();  // return String
    }

    @Override
    public Boolean proceedPayment(PaymentOrder paymentOrder,
                                  String paymentId,
                                  String paymentLinkId)
            throws RazorpayException {
        if (paymentOrder.getStatus().equals(PaymentOrderStatus.PENDING)){
            if(paymentOrder.getPaymentMethod().equals(PaymentMethod.RAZORPAY)){
                RazorpayClient razorpayClient = new RazorpayClient(razorpayAPIKey,
                        razorAPISecretKey);
                Payment payment = razorpayClient.payments.fetch(paymentId);
                Integer amount = payment.get("amount");
                String status = payment.get("status");
                if (status.equals("captured")){
                    //add code for Kafka or RabbitMQ
                    paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
                    paymentRepository.save(paymentOrder);
                    return true;
                }
                return false;
            }else {
                paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
                paymentRepository.save(paymentOrder);
                return true;
            }
        }
        return false;
    }
}
