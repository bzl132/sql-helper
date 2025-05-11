package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class InstallmentMG implements Serializable {

    private static final long serialVersionUID = -3264403026830952137L;

    /**
     * 缴费金额
     */
    private String paymentAmount;

    /**
     * 缴费起期
     */
    private LocalDateTime paymentStartDt;

    /**
     * 缴费止期
     */
    private LocalDateTime paymentEndDT;

    /**
     * 缴费期次
     */
    private Integer sequenceNo;



}
