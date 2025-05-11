package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * @Author fuyuanjie
 * @Date 2024/12/4
 * 共保参与方
 */

@Data
public class CoGuarantorMG {
    /**
     *是否主承方
     */
    private String isMasterCoinsurance;
    /**
     * 共保出单机构客户ID
     */
    private String coinsuranceIssueOrgCustomerId;
    /**
     * 共保公司类型
     */
    private String coinsuranceCompanyType;

    /**
     * 含税保费
     */
    private BigDecimal coinsurancePremium;

    /**
     * 保额
     */
    private BigDecimal coinsuranceAmount;
    /**
     * 联保公司代码
     */
    private String coinsuranceCompanyCode;
    /**
     * 联共保类型
     */
    private String unionCoinsuranceType;
    /**
     * 从联出单机构path
     */
    private List<String> unionCoinsuranceIssueOrgCodePath;
}
