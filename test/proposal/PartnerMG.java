package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;

/**
 * 合作伙伴
 */
@Data
public class PartnerMG implements Serializable {

    private static final long serialVersionUID = 4988035683359556206L;

    /**
     * 合作伙伴名称
     */
    private String partnerName;
}
