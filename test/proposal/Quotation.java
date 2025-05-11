package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.aliyun.fsi.insurance.passinfo.shared.mask.MaskRetention;
import com.aliyun.fsi.insurance.passinfo.shared.mask.SensitiveTypeEnum;
import com.aliyun.fsi.insurance.proposal.biz.base.dto.UnderWritingDTO;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * 报价单
 */
public class Quotation implements Serializable {
    private static final long serialVersionUID = -223138031245190382L;
    /**
     * 关联单号
     */
    private String quotationOrderNo;
    /**
     * 关联单号类型
     */
    private String quotationOrderType;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateTimeSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateTimeDeserializer.class
    )
    /**
     * 保单起保时间
     */
    private LocalDateTime policyStartDt;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateTimeSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateTimeDeserializer.class
    )
    /**
     * 保单终止时间
     */
    private LocalDateTime policyEndDt;

    /**
     * 报价单号
     */
    private String quotationNo;

    /**
     * 投保单号
     */
    private String proposalNo;

    /**
     * 保单号
     */
    private String policyNo;

    /**
     * 承保方式
     */
    private String underwritingMethodCd;


    private List<ApplicantMG> applicantList;

    private List<InsuredMG> insuredList;
    /**
     * 录单人编号
     */
    private String recordHolderEmpNo;

    /**
     * 录单人姓名
     */
    @MaskRetention(
            type = SensitiveTypeEnum.DEFAULT,
            group = {0})
    private String recordHolderName;

    /**
     * 经办人工号
     */
    private String handlerEmpNo;

    /**
     * 经办人名称
     */
    @MaskRetention(
            type = SensitiveTypeEnum.DEFAULT,
            group = {0})
    private String handlerName;

    /**
     * 保费
     */
    private FeeMG fee;
    /**
     * 归属机构编码列表（上级机构+当前机构）
     */
    private List<String> bizOrgCodeList;

    /**
     * 归属机构代码
     */
    private String bizOrgCode;

    /**
     * 归属机构名称
     */
    private String bizOrgName;

    /**
     * 出单机构编码列表
     */
    private List<String> issueOrgCodeList;
    /**
     * 出单机构编码
     */
    private String issueOrgCode;

    /**
     * 出单机构名称
     */
    private String issueOrgName;
    /**
     * 出单机构编码2级
     */

    private String issueOrg2LevelCode;


    /**
     * 业务来源
     */
    private String bizSourceCd;

    /**
     * 是否转特批 0否，1是
     */
    private String isSignReport;

    /**
     * 产品大类编码
     */
    private String productCategoryCode;
    /**
     * 产品细类编码
     */
    private String productSmallCategoryCode;

    /**
     * 预核保/核保通过日期
     */
    private LocalDateTime underWritingPassDt;
    /**
     * 核保信息
     */
    private UnderWritingDTO underWritingDTO;

    /**
     * 是否直销
     */
    private String isDirectSale;

    /**
     * 方案编号集合
     */
    private String schemeCode;

    /**
     * 方案名称
     */
    private String schemeName;

    /**
     * 方案打印名称
     */
    private String schemePrintName;

    /**
     * 见费出单标志 0-否 1-是
     *
     * @see com.aliyun.fsi.insurance.proposal.biz.base.enums.SeeFeeFlag
     */
    private String isSeeFee;

    /**
     * 非见费点单模式
     */
    private String nonSeeFeeOrderMode;

    /**
     * 产品code
     */
    private String productCode;
    /**
     * 产品名称
     */
    private String productName;

    /**
     * 批次号
     */
    private String batchNo;

    /**
     * 报价单状态
     */
    private String quotationStatusCd;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateTimeSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateTimeDeserializer.class
    )
    /**
     * 录单日期 eg: 2020-10-01
     */
    private LocalDateTime quotationCreateDt;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateTimeSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateTimeDeserializer.class
    )
    /**
     * 保单期间单位
     */
    private String policyPeriodUnitCd;

    /**
     * 保单期间
     */
    private String policyPeriod;


    /**
     * 是否团单 1-个单 2-团单
     */
    private String isGroupPolicy;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateTimeSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateTimeDeserializer.class
    )
    /**
     * 签单时间
     */
    private LocalDateTime signDt;

    /**
     * 涉农类型 0-商业性涉农 1-政策性涉农
     */
    private String agricultureTypeCd;

    /**
     * 分期标识 1-分期 2-非分期
     */
    private String installmentFlagCd;

    /**
     * 共保类型
     */
    private String coinsuranceFlagCd;

    /**
     * 是否临分分出 0-否 1-是
     */
    private String isFacultativeReinsurance;

    /**
     * 是否临分分入 0-否 1-是
     */
    private String isFacultativeReinsuranceIn;

    /**
     * 是否特殊申报标识 0-否 1-是
     */
    private String isSpecialDeclarationIdentification;

    /**
     * 是否合约除外标识 0-否 1-是
     */
    private String isContractExclusionIdentification;

    /**
     * 是否危险单位拆分标识 0-否 1-是
     */
    private String isSplitHazardousUnitIdentification;

    /**
     * 代理人编码
     */
    private String agentCode;

    /**
     * 代理人姓名
     */
    @MaskRetention(
            type = SensitiveTypeEnum.DEFAULT,
            group = {0})
    private String agentName;
    /**
     * 关联产品
     */
    private Set<String> productCategoryCodes;

    /**
     * 车船税金额
     */
    private BigDecimal taxTotalAmount;
    /**
     * 车队号
     */
    private String fleetNo;
    /**
     * 协议号版本
     */
    private String fleetVersion;
    /**
     * 车队标识
     */
    private String isFleet;

    /**
     * 出单系统
     */
    private String systemSourceCode;

    /**
     * 系统来源二级
     * 如渠道对接，这里就是对应的渠道编码
     */
    private String systemSourceLevel2Code;

    /**
     * 创建时间
     */
    private LocalDateTime createDt;

    /**
     * 修改时间
     */
    private LocalDateTime modifiedDt;

    /**
     * 文档中心场景编码
     */
    private String sceneCode;

    /**
     * 文档中心唯一id
     */
    private String businessNo;

    /**
     * 投保日期 线上一体化缴费需要
     * @return
     */
    private LocalDateTime proposalDt;

    /**
     * 交商同保标志
     */
    private String relatedPolicyType;

    /**
     * 合作伙伴Code
     */
    private String partnerCode;
    /**
     * 合作伙伴名称
     */
    private String partnerName;

    /**
     * 报价快照标志
     */
    private String inquirySnapshotFlag;

    /**
     * 影像id
     */
    private String serialNo;
    /**
     *
     * is_valid=1表示有效
     */
    protected Integer isValid;

    /**
     * 团单个缴标志 0-否 1-是
     */
    private String isGroupPersonalPay;

    /**
     * 车辆信息
     */
    private VehicleInfoMG vehicleInfo;

    /**
     * 合作伙伴
     */
    private PartnerMG partner;

    /**
     * 车主信息
     */
    private VehicleOwnerMG vehicleOwner;

    /**
     * 车险投保信息
     * @return
     */
    private VehicleInsureMG vehicleInsure;

    /**
     * 车慧达货车评分
     */
    private CheHDTrackTrancheScoreDtoMG cheHDTrackTrancheScoreDto;

    /**
     * 共保协议申请号
     */
    private String coinsuranceApplicationNo;

    /**
     * 共保协议号
     */
    private String coinsuranceAgreementNo;

    /**
     * 联保协议号
     */
    private String unionInsuranceAgreementNo;

    /**
     * 联保协议申请号
     */
    private String unionInsuranceApplicationNo;

    /**
     * 从联方出单机构编码
     */
    private List<String> unionIssueOrgCodeList;

    /**
     * 联保参与方信息
     */
    private List<CoGuarantorMG> unionCoGuarantorList;

    /**
     * 特批业务类型
     */
    private String approveBizType;

    /**
     *  是否展示报价 （1 为是   0为否）
     */
    private String showQuotation;
    /**
     * 报价有效时间
     */
    private Integer quotationValidity;
    /**
     * 报价失效时间
     */
    private LocalDateTime quotationValidityEndDt;
    /**
     * 基础报价单（财责多版本报价）
     * 本字段存储的是多版本报价单中初次报价单的单号
     */
    private String baseQuotationNo;

    /**
     * OA审批会签号
     */
    private String signatureOANo;

    /**
     * 船舶险信息
     */
    private List<HullMG> hullMGList;

    /**
     * 飞机信息
     */
    private List<AircraftMG> aircraftMGList;

    /**
     * OA信息
     * @return
     */
    private List<OaMG> OAList;

    /**
     * 代理人证件号
     */
    private String  agentCertNo;
    /**
     * 是否单位汇缴 boolean_cd "0"-否 "1"-是
     */
    private String remitUnitFlag;

    /**
     * 创建人
     */
    private String creator;

    /**
     * 关联单X险的投保单号/报价单号
     */
    private List<String> relationNos;

    public List<String> getRelationNos() {
        return relationNos;
    }

    public void setRelationNos(List<String> relationNos) {
        this.relationNos = relationNos;
    }

    public String getCreator() {
        return this.creator;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    public String getPrimaryInsurance() {
        return primaryInsurance;
    }

    public void setPrimaryInsurance(String primaryInsurance) {
        this.primaryInsurance = primaryInsurance;
    }

    /**
     *
     *主险标识 1=主险，0非主险
     */
    private String primaryInsurance;

    /**
     * 投保单增加好投保查询参数:监管订单号
     */
    private  String superviseBizNo;
    /**
     * 1表示：是好投保，0非好投保
     */
    private  String isHtb;


    /**
     * 货运险，运输工具名称
     */
    private String transportName;

    public String getSuperviseBizNo() {
        return this.superviseBizNo;
    }

    public void setSuperviseBizNo(String superviseBizNo) {
        this.superviseBizNo = superviseBizNo;
    }

    public String getIsHtb() {
        return this.isHtb;
    }

    public void setIsHtb(String isHtb) {
        this.isHtb = isHtb;
    }

    public String getTransportName() {
        return transportName;
    }

    public void setTransportName(String transportName) {
        this.transportName = transportName;
    }

    public String getAgentCertNo() {
        return agentCertNo;
    }

    public void setAgentCertNo(String agentCertNo) {
        this.agentCertNo = agentCertNo;
    }

    /**
     * 协保员id
     */
    private String assistInsurePersonId;


    /**
     * 标的项目名称
     */
    private String subjectProjectName;


    public String getSubjectProjectName() {
        return subjectProjectName;
    }

    public void setSubjectProjectName(String subjectProjectName) {
        this.subjectProjectName = subjectProjectName;
    }

    public String getAssistInsurePersonId() {
        return assistInsurePersonId;
    }

    public void setAssistInsurePersonId(String assistInsurePersonId) {
        this.assistInsurePersonId = assistInsurePersonId;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    public String getSchemePrintName() {
        return schemePrintName;
    }

    public void setSchemePrintName(String schemePrintName) {
        this.schemePrintName = schemePrintName;
    }

    public List<OaMG> getOAList() {
        return OAList;
    }

    public void setOAList(List<OaMG> OAList) {
        this.OAList = OAList;
    }

    public Integer getQuotationValidity() {
        return quotationValidity;
    }

    public void setQuotationValidity(Integer quotationValidity) {
        this.quotationValidity = quotationValidity;
    }

    public LocalDateTime getQuotationValidityEndDt() {
        return quotationValidityEndDt;
    }

    public void setQuotationValidityEndDt(LocalDateTime quotationValidityEndDt) {
        this.quotationValidityEndDt = quotationValidityEndDt;
    }

    public String getBaseQuotationNo() {
        return baseQuotationNo;
    }

    public void setBaseQuotationNo(String baseQuotationNo) {
        this.baseQuotationNo = baseQuotationNo;
    }

    public String getSignatureOANo() {
        return signatureOANo;
    }

    public void setSignatureOANo(String signatureOANo) {
        this.signatureOANo = signatureOANo;
    }

    /**
     * 客群标识(KQ01-个人 KQ02-团体 KQ03-政保)
     */
    private String customerGroupCd;

    /**
     * 定时批改标识
     */
    private String timedCorrectionFlag;

    /**
     * 关联项目-项目代码
     */
    private String projectCode;

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }

    public String getCustomerGroupCd() {
        return customerGroupCd;
    }

    public void setCustomerGroupCd(String customerGroupCd) {
        this.customerGroupCd = customerGroupCd;
    }

    public String getApproveBizType() {
        return approveBizType;
    }

    public void setApproveBizType(String approveBizType) {
        this.approveBizType = approveBizType;
    }

    public CheHDTrackTrancheScoreDtoMG getCheHDTrackTrancheScoreDto() {
        return cheHDTrackTrancheScoreDto;
    }

    public void setCheHDTrackTrancheScoreDto(CheHDTrackTrancheScoreDtoMG cheHDTrackTrancheScoreDto) {
        this.cheHDTrackTrancheScoreDto = cheHDTrackTrancheScoreDto;
    }

    public String getIsFacultativeReinsuranceIn() {
        return isFacultativeReinsuranceIn;
    }

    public void setIsFacultativeReinsuranceIn(String isFacultativeReinsuranceIn) {
        this.isFacultativeReinsuranceIn = isFacultativeReinsuranceIn;
    }

    public String getIsSpecialDeclarationIdentification() {
        return isSpecialDeclarationIdentification;
    }

    public void setIsSpecialDeclarationIdentification(String isSpecialDeclarationIdentification) {
        this.isSpecialDeclarationIdentification = isSpecialDeclarationIdentification;
    }

    public String getIsContractExclusionIdentification() {
        return isContractExclusionIdentification;
    }

    public void setIsContractExclusionIdentification(String isContractExclusionIdentification) {
        this.isContractExclusionIdentification = isContractExclusionIdentification;
    }

    public String getIsSplitHazardousUnitIdentification() {
        return isSplitHazardousUnitIdentification;
    }

    public void setIsSplitHazardousUnitIdentification(String isSplitHazardousUnitIdentification) {
        this.isSplitHazardousUnitIdentification = isSplitHazardousUnitIdentification;
    }

    public VehicleInsureMG getVehicleInsure() {
        return vehicleInsure;
    }

    public void setVehicleInsure(VehicleInsureMG vehicleInsure) {
        this.vehicleInsure = vehicleInsure;
    }

    public VehicleInfoMG getVehicleInfo() {
        return vehicleInfo;
    }

    public void setVehicleInfo(VehicleInfoMG vehicleInfo) {
        this.vehicleInfo = vehicleInfo;
    }

    public VehicleOwnerMG getVehicleOwner() {
        return vehicleOwner;
    }

    public void setVehicleOwner(VehicleOwnerMG vehicleOwner) {
        this.vehicleOwner = vehicleOwner;
    }

    public PartnerMG getPartner() {
        return partner;
    }

    public void setPartner(PartnerMG partner) {
        this.partner = partner;
    }


    public String getUnderwritingMethodCd() {
        return underwritingMethodCd;
    }

    public void setUnderwritingMethodCd(String underwritingMethodCd) {
        this.underwritingMethodCd = underwritingMethodCd;
    }

    public UnderWritingDTO getUnderWritingDTO() {
        return underWritingDTO;
    }

    public void setUnderWritingDTO(UnderWritingDTO underWritingDTO) {
        this.underWritingDTO = underWritingDTO;
    }

    public String getPartnerCode() {
        return partnerCode;
    }

    public void setPartnerCode(String partnerCode) {
        this.partnerCode = partnerCode;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }

    public String getIsFleet() {
        return isFleet;
    }

    public void setIsFleet(String isFleet) {
        this.isFleet = isFleet;
    }

    public Integer getIsValid() {
        return isValid;
    }

    public void setIsValid(Integer isValid) {
        this.isValid = isValid;
    }

    public String getRelatedPolicyType() {
        return relatedPolicyType;
    }

    public void setRelatedPolicyType(String relatedPolicyType) {
        this.relatedPolicyType = relatedPolicyType;
    }

    public String getQuotationOrderNo() {
        return quotationOrderNo;
    }

    public void setQuotationOrderNo(String quotationOrderNo) {
        this.quotationOrderNo = quotationOrderNo;
    }

    public String getQuotationOrderType() {
        return quotationOrderType;
    }

    public void setQuotationOrderType(String quotationOrderType) {
        this.quotationOrderType = quotationOrderType;
    }

    public String getQuotationNo() {
        return quotationNo;
    }

    public void setQuotationNo(String quotationNo) {
        this.quotationNo = quotationNo;
    }

    public String getProposalNo() {
        return proposalNo;
    }

    public void setProposalNo(String proposalNo) {
        this.proposalNo = proposalNo;
    }

    public String getPolicyNo() {
        return policyNo;
    }

    public void setPolicyNo(String policyNo) {
        this.policyNo = policyNo;
    }

    public List<ApplicantMG> getApplicantList() {
        return applicantList;
    }

    public void setApplicantList(List<ApplicantMG> applicantList) {
        this.applicantList = applicantList;
    }

    public List<InsuredMG> getInsuredList() {
        return insuredList;
    }

    public void setInsuredList(List<InsuredMG> insuredList) {
        this.insuredList = insuredList;
    }

    public String getRecordHolderEmpNo() {
        return recordHolderEmpNo;
    }

    public void setRecordHolderEmpNo(String recordHolderEmpNo) {
        this.recordHolderEmpNo = recordHolderEmpNo;
    }

    public String getRecordHolderName() {
        return recordHolderName;
    }

    public void setRecordHolderName(String recordHolderName) {
        this.recordHolderName = recordHolderName;
    }

    public String getHandlerEmpNo() {
        return handlerEmpNo;
    }

    public void setHandlerEmpNo(String handlerEmpNo) {
        this.handlerEmpNo = handlerEmpNo;
    }

    public String getHandlerName() {
        return handlerName;
    }

    public void setHandlerName(String handlerName) {
        this.handlerName = handlerName;
    }

    public FeeMG getFee() {
        return fee;
    }

    public void setFee(FeeMG fee) {
        this.fee = fee;
    }

    public List<String> getBizOrgCodeList() {
        return bizOrgCodeList;
    }

    public void setBizOrgCodeList(List<String> bizOrgCodeList) {
        this.bizOrgCodeList = bizOrgCodeList;
    }

    public String getBizOrgCode() {
        return bizOrgCode;
    }

    public void setBizOrgCode(String bizOrgCode) {
        this.bizOrgCode = bizOrgCode;
    }

    public String getBizOrgName() {
        return bizOrgName;
    }

    public void setBizOrgName(String bizOrgName) {
        this.bizOrgName = bizOrgName;
    }

    public List<String> getIssueOrgCodeList() {
        return issueOrgCodeList;
    }

    public void setIssueOrgCodeList(List<String> issueOrgCodeList) {
        this.issueOrgCodeList = issueOrgCodeList;
    }

    public String getIssueOrgCode() {
        return issueOrgCode;
    }

    public void setIssueOrgCode(String issueOrgCode) {
        this.issueOrgCode = issueOrgCode;
    }

    public String getIssueOrgName() {
        return issueOrgName;
    }

    public void setIssueOrgName(String issueOrgName) {
        this.issueOrgName = issueOrgName;
    }

    public String getIssueOrg2LevelCode() {
        return issueOrg2LevelCode;
    }

    public void setIssueOrg2LevelCode(String issueOrg2LevelCode) {
        this.issueOrg2LevelCode = issueOrg2LevelCode;
    }

    public String getBizSourceCd() {
        return bizSourceCd;
    }

    public void setBizSourceCd(String bizSourceCd) {
        this.bizSourceCd = bizSourceCd;
    }

    public String getProductCategoryCode() {
        return productCategoryCode;
    }

    public void setProductCategoryCode(String productCategoryCode) {
        this.productCategoryCode = productCategoryCode;
    }

    public String getProductSmallCategoryCode() {
        return productSmallCategoryCode;
    }

    public void setProductSmallCategoryCode(String productSmallCategoryCode) {
        this.productSmallCategoryCode = productSmallCategoryCode;
    }

    public LocalDateTime getUnderWritingPassDt() {
        return underWritingPassDt;
    }

    public void setUnderWritingPassDt(LocalDateTime underWritingPassDt) {
        this.underWritingPassDt = underWritingPassDt;
    }

    public String getIsDirectSale() {
        return isDirectSale;
    }

    public void setIsDirectSale(String isDirectSale) {
        this.isDirectSale = isDirectSale;
    }

    public String getSchemeCode() {
        return schemeCode;
    }

    public void setSchemeCode(String schemeCode) {
        this.schemeCode = schemeCode;
    }

    public String getIsSeeFee() {
        return isSeeFee;
    }

    public void setIsSeeFee(String isSeeFee) {
        this.isSeeFee = isSeeFee;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getBatchNo() {
        return batchNo;
    }

    public void setBatchNo(String batchNo) {
        this.batchNo = batchNo;
    }

    public String getQuotationStatusCd() {
        return quotationStatusCd;
    }

    public void setQuotationStatusCd(String quotationStatusCd) {
        this.quotationStatusCd = quotationStatusCd;
    }

    public LocalDateTime getQuotationCreateDt() {
        return quotationCreateDt;
    }

    public void setQuotationCreateDt(LocalDateTime quotationCreateDt) {
        this.quotationCreateDt = quotationCreateDt;
    }

    public String getPolicyPeriodUnitCd() {
        return policyPeriodUnitCd;
    }

    public void setPolicyPeriodUnitCd(String policyPeriodUnitCd) {
        this.policyPeriodUnitCd = policyPeriodUnitCd;
    }

    public String getPolicyPeriod() {
        return policyPeriod;
    }

    public void setPolicyPeriod(String policyPeriod) {
        this.policyPeriod = policyPeriod;
    }

    public String getIsGroupPolicy() {
        return isGroupPolicy;
    }

    public void setIsGroupPolicy(String isGroupPolicy) {
        this.isGroupPolicy = isGroupPolicy;
    }

    public LocalDateTime getSignDt() {
        return signDt;
    }

    public void setSignDt(LocalDateTime signDt) {
        this.signDt = signDt;
    }

    public String getAgricultureTypeCd() {
        return agricultureTypeCd;
    }

    public void setAgricultureTypeCd(String agricultureTypeCd) {
        this.agricultureTypeCd = agricultureTypeCd;
    }

    public String getInstallmentFlagCd() {
        return installmentFlagCd;
    }

    public void setInstallmentFlagCd(String installmentFlagCd) {
        this.installmentFlagCd = installmentFlagCd;
    }

    public String getCoinsuranceFlagCd() {
        return coinsuranceFlagCd;
    }

    public void setCoinsuranceFlagCd(String coinsuranceFlagCd) {
        this.coinsuranceFlagCd = coinsuranceFlagCd;
    }

    public String getIsFacultativeReinsurance() {
        return isFacultativeReinsurance;
    }

    public void setIsFacultativeReinsurance(String isFacultativeReinsurance) {
        this.isFacultativeReinsurance = isFacultativeReinsurance;
    }

    public String getAgentCode() {
        return agentCode;
    }

    public void setAgentCode(String agentCode) {
        this.agentCode = agentCode;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public Set<String> getProductCategoryCodes() {
        return productCategoryCodes;
    }

    public void setProductCategoryCodes(Set<String> productCategoryCodes) {
        this.productCategoryCodes = productCategoryCodes;
    }

    public BigDecimal getTaxTotalAmount() {
        return taxTotalAmount;
    }

    public void setTaxTotalAmount(BigDecimal taxTotalAmount) {
        this.taxTotalAmount = taxTotalAmount;
    }

    public String getFleetNo() {
        return fleetNo;
    }

    public void setFleetNo(String fleetNo) {
        this.fleetNo = fleetNo;
    }

    public String getSystemSourceCode() {
        return systemSourceCode;
    }

    public void setSystemSourceCode(String systemSourceCode) {
        this.systemSourceCode = systemSourceCode;
    }

    public String getSystemSourceLevel2Code() {
        return systemSourceLevel2Code;
    }

    public void setSystemSourceLevel2Code(String systemSourceLevel2Code) {
        this.systemSourceLevel2Code = systemSourceLevel2Code;
    }

    public LocalDateTime getCreateDt() {
        return createDt;
    }

    public void setCreateDt(LocalDateTime createDt) {
        this.createDt = createDt;
    }

    public LocalDateTime getModifiedDt() {
        return modifiedDt;
    }

    public void setModifiedDt(LocalDateTime modifiedDt) {
        this.modifiedDt = modifiedDt;
    }

    public String getSceneCode() {
        return sceneCode;
    }

    public void setSceneCode(String sceneCode) {
        this.sceneCode = sceneCode;
    }

    public String getBusinessNo() {
        return businessNo;
    }

    public void setBusinessNo(String businessNo) {
        this.businessNo = businessNo;
    }

    public LocalDateTime getProposalDt() {
        return proposalDt;
    }

    public void setProposalDt(LocalDateTime proposalDt) {
        this.proposalDt = proposalDt;
    }

    public String getInquirySnapshotFlag() {
        return inquirySnapshotFlag;
    }

    public void setInquirySnapshotFlag(String inquirySnapshotFlag) {
        this.inquirySnapshotFlag = inquirySnapshotFlag;
    }

    public String getSerialNo() {
        return serialNo;
    }

    public void setSerialNo(String serialNo) {
        this.serialNo = serialNo;
    }

    public String getIsSignReport() {
        return isSignReport;
    }

    public void setIsSignReport(String isSignReport) {
        this.isSignReport = isSignReport;
    }

    public String getIsGroupPersonalPay() {
        return isGroupPersonalPay;
    }

    public void setIsGroupPersonalPay(String isGroupPersonalPay) {
        this.isGroupPersonalPay = isGroupPersonalPay;
    }

    public String getCoinsuranceAgreementNo() {
        return coinsuranceAgreementNo;
    }

    public void setCoinsuranceAgreementNo(String coinsuranceAgreementNo) {
        this.coinsuranceAgreementNo = coinsuranceAgreementNo;
    }

    public String getCoinsuranceApplicationNo() {
        return coinsuranceApplicationNo;
    }

    public void setCoinsuranceApplicationNo(String coinsuranceApplicationNo) {
        this.coinsuranceApplicationNo = coinsuranceApplicationNo;
    }

    public LocalDateTime getPolicyStartDt() {
        return policyStartDt;
    }

    public void setPolicyStartDt(LocalDateTime policyStartDt) {
        this.policyStartDt = policyStartDt;
    }

    public LocalDateTime getPolicyEndDt() {
        return policyEndDt;
    }

    public void setPolicyEndDt(LocalDateTime policyEndDt) {
        this.policyEndDt = policyEndDt;
    }

    public String getShowQuotation() {
        return showQuotation;
    }

    public void setShowQuotation(String showQuotation) {
        this.showQuotation = showQuotation;
    }

    public String getTimedCorrectionFlag() {
        return timedCorrectionFlag;
    }

    public void setTimedCorrectionFlag(String timedCorrectionFlag) {
        this.timedCorrectionFlag = timedCorrectionFlag;
    }

    public String getUnionInsuranceAgreementNo() {
        return unionInsuranceAgreementNo;
    }

    public void setUnionInsuranceAgreementNo(String unionInsuranceAgreementNo) {
        this.unionInsuranceAgreementNo = unionInsuranceAgreementNo;
    }

    public String getUnionInsuranceApplicationNo() {
        return unionInsuranceApplicationNo;
    }

    public void setUnionInsuranceApplicationNo(String unionInsuranceApplicationNo) {
        this.unionInsuranceApplicationNo = unionInsuranceApplicationNo;
    }

    public List<String> getUnionIssueOrgCodeList() {
        return unionIssueOrgCodeList;
    }

    public void setUnionIssueOrgCodeList(List<String> unionIssueOrgCodeList) {
        this.unionIssueOrgCodeList = unionIssueOrgCodeList;
    }

    public List<HullMG> getHullMGList() {
        return hullMGList;
    }

    public void setHullMGList(List<HullMG> hullMGList) {
        this.hullMGList = hullMGList;
    }

    public List<AircraftMG> getAircraftMGList() {
        return aircraftMGList;
    }

    public void setAircraftMGList(List<AircraftMG> aircraftMGList) {
        this.aircraftMGList = aircraftMGList;
    }


    public String getRemitUnitFlag() {
        return remitUnitFlag;
    }

    public void setRemitUnitFlag(String remitUnitFlag) {
        this.remitUnitFlag = remitUnitFlag;
    }

    public String getNonSeeFeeOrderMode() {
        return nonSeeFeeOrderMode;
    }

    public void setNonSeeFeeOrderMode(String nonSeeFeeOrderMode) {
        this.nonSeeFeeOrderMode = nonSeeFeeOrderMode;
    }

    public List<CoGuarantorMG> getUnionCoGuarantorList() {
        return unionCoGuarantorList;
    }

    public void setUnionCoGuarantorList(List<CoGuarantorMG> unionCoGuarantorList) {
        this.unionCoGuarantorList = unionCoGuarantorList;
    }

    public String getFleetVersion() {
        return this.fleetVersion;
    }

    public void setFleetVersion(String fleetVersion) {
        this.fleetVersion = fleetVersion;
    }
}
