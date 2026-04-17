package com.salon.payloadReponse;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class PaymentLinkResponse {
    private String payment_link_url;
    private String get_payment_link_Id;
}
