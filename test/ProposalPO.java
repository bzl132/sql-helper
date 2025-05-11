package com.aliyun.fsi.insurance.biz.proposal.infrastructure.repository.dataobject;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

@Setter
@Getter
public class ProposalPO  extends BasePO{
    private String quotationOrderNo;

    private String quotationOrderType;

    private String isFromInquiry;
    
    private String quotationNo;

    private String underwritingMethodCd;

    private String proposalMethodCd;	// 
    
    private String proposalNo;

    private String externalOrderNo;

    private Date proposalDt;

    private Integer proposalCopies;

    private Date quotationCreateDt;

    private Date proposalCreateDt;

    private String isReadClause;

    private String policyNo;

    private String quotationStatusCd;

    private String proposalStatusCd;

    private String policyCategoryCd;

    private String policyTypeCd;

    private String policyPeriodUnitCd;

    private String policyPeriod;

    private Date policyStartDt;

    private Date policyEndDt;

    private String isGroupPolicy;

    private Date signDt;

    private String isAutoTransferNew;

    private Date hesitationDeadlineDt;

    private Date waitingPeriodDeadlineDt;

    private String isAgriculture;

    private String agricultureTypeCd;

    private String isHandMadeTicket;

    private String handMadeTicketNo;

    private String subsidyFlagCd;

    private String isElectronPolicy;

    private String isCommerceReinsurance;
    
    private String isCrossSale;

    private String installmentFlagCd;

    private Integer installmentPeriod;

    private Integer installmentInterval;

    private String installmentIntervalUnitCd;

    private String isSeeFee;

    private String proposalLabelCd;

    private String transModeCd;

    private String installmentInfo;

    private String largessFlagCd;

    private String isFacultativeReinsurance;

    private String disputeResolutionCd;

    private String judicialScopeCd;

    private String arbitrationAgencyCd;

    private String arbitrationAgencyName;

    private String online;

    private String isAgreeCustomerShare;

    private String isSignReport;

    private Integer limitReserveSignDays;
    private String isSupplementary;
    private String isSupplyInsured;
    private BigDecimal feeRate;
    private Integer antiMoneyLaunderingFlagCd;
    private String isRemoteUnderwrite;
    
    private String systemSourceCode;

    private String systemSourceLevel2Code;

    private String isDirectSale;

    private String bizSourceCd;

    private String bizSourcePath;

    /**
     * 业务来源大类
     */
    private String bizSourceCategoryCd;

    private String channelTypeCd;

    private String isEffectiveImmediately;

    private String isReserveSign;
    
    private String comment;

    /**
     * 语种代码
     */
    private String languageCd;


    private String extendInfo;

    private String deductible;

    private String limit;

    private String issueOrg;

    private String signOrg;

    private String recordHolder;

    private String handlerList;

    private String fee;

    private String channel;

    private String relatedProject;

    private String relatedThirdPartyList;

    private String productCategoryCode;

    private String productCategoryName;

    private String productSmallCategoryCode;

    private String productSmallCategoryName;

    private String productCode;

    private String productName;

    private String productVersion;

    private String schemeTypeCd;

    private String schemeCode;

    private String schemeVersion;

    private String schemeName;

    private String familyPolicyFlagCd;

    private String shortTermPolicyFlagCd;

    private String followfee;

    private String customerContact;

    private String policyRelationInfo;

    private String approveInfo;

    private BigDecimal valueAddedExpenseAmount;

    private String isFacultativeReinsuranceIn;

    private String customerLevelLabelCd;

    private String isElectronicSign;

    private String isVideoAssistant;

    private String healthNotice;

    private String coinsuranceFlagCd;

    private String customerGroupCd;

    private String supplementaryClauseInfo;
}