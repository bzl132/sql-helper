package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;


/**
 * 保费保额
 */
@Data
public class FeeMG implements Serializable {
    private static final long serialVersionUID = -8269340692411877785L;

    /**
     * 原币签单保费
     */
    private String signPremium;

    /**
     * 签单币代码
     */
    private String signCurrencyCode;

    /**
     * 签单币名称
     */
    private String signCurrencyName;

    /**
     * 本币总保额
     */
    private String localCurrencyInsuredAmount;

    /**
     * 本币签单保费
     */
    private String localCurrencySignPremium;

    /**
     * 本位币含税保费
     */
    private String localCurrencyWithTaxPremium;

    /**
     * 本位币不含税保费
     */
    private String localCurrencyNoTaxPremium;

    /**
     * 本位币税额
     */
    private String localCurrencyTaxAmount;

    /**
     * 中央财政补贴比例
     */
    private String centralFinancialSubsidyRate;
    /**
     * 中央财政补贴金额
     */
    private String centralFinancialSubsidyAmount;
    /**
     * 省级财政补贴比例
     */
    private String provinceSubsidyRate;
    /**
     * 省级财政补贴金额
     */
    private String provinceSubsidyAmount;
    /**
     * 市级补贴比例
     */
    private String citySubsidyRate;
    /**
     * 市级补贴金额
     */
    private String citySubsidyAmount;
    /**
     * 县级补贴比例
     */
    private String countySubsidyRate;
    /**
     * 县级补贴金额
     */
    private String countySubsidyAmount;
    /**
     * 乡级财政补贴比例
     */
    private String townshipSubsidyRate;
    /**
     * 乡级财政补贴金额
     */
    private String townshipSubsidyAmount;
    /**
     * 龙头企业财政补贴比例
     */
    private String leadingEnterprisesSubsidyRate;
    /**
     * 龙头企业财政补贴金额
     */
    private String leadingEnterprisesSubsidyAmount;
    /**
     * 其他财政补贴比例
     */
    private String otherSubsidyRate;
    /**
     * 其他财政补贴金额
     */
    private String otherSubsidyAmount;
    /**
     * 农户自缴费用比例
     */
    private String peasantPremiumRate;
    /**
     * 农户自缴费用金额
     */
    private String peasantPremiumAmount;
    /**
     * 合计比例
     */
    private String totalRate;
    /**
     * 合计金额
     */
    private String totalAmount;

    /**
     * 20240425 新增农户保费
     */
    private String subsidyAmount;

    /**
     * 农户专项补贴金额
     */
    private String agricultureSubsidyAmount;


    /**
     * 总保额
     */
    private String insuredAmount;
}
