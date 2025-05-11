package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 车险投保信息
 */
@Data
public class VehicleInsureMG implements Serializable {
    private static final long serialVersionUID = -3104559194152591775L;

    /**
     * ncd系数级别
     */
    private BigDecimal ncdLevelCd;

    /**
     * 客户风险评级
     */
    private String customerRiskLevel;

    /**
     * 是否在监管上下限区间
     */
    private String regulatoryUpperAndLowerLimits;

    /**
     * 价费规则返回的流水号
     */
    private String priceAndFeeBusinessNo;

    /**
     * 平台交易号
     */
    private String circPaymentNo;

    /**
     * 是否政策性农机险，枚举值：0:“否”、1:“是”
     */
    private String isPolicyAgricultural;

    /**
     * 延迟出单时间
     */
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime delayIssueDt;

}
